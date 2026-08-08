import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

const TEACHER_TOKEN_COOKIE = 'achivox_teacher_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Query Firestore for user with this email
    const usersRef = db.collection('users');
    const querySnap = await usersRef.where('email', '==', cleanEmail).limit(1).get();

    if (querySnap.empty) {
      return NextResponse.json(
        { error: 'No teacher account found with this email.' },
        { status: 401 }
      );
    }

    const userDoc = querySnap.docs[0];
    const userData = userDoc.data();

    // Must have adminAssignedTeacher === true
    if (userData.adminAssignedTeacher !== true) {
      return NextResponse.json(
        { error: 'Access denied. Admin has not granted Teacher role to this account.' },
        { status: 403 }
      );
    }

    // Password must match
    if (!userData.teacherPassword || userData.teacherPassword.trim() !== cleanPass) {
      return NextResponse.json(
        { error: 'Incorrect password. Please use the password provided by Admin.' },
        { status: 401 }
      );
    }

    // Build a signed token value: uid:timestamp (simple — no JWT dependency needed)
    const tokenValue = `${userDoc.id}:${Date.now()}`;

    // Create response and set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      teacher: {
        uid: userDoc.id,
        email: userData.email || cleanEmail,
        name: userData.name || userData.displayName || cleanEmail.split('@')[0] || 'Teacher',
      }
    });

    response.cookies.set(TEACHER_TOKEN_COOKIE, tokenValue, {
      httpOnly: true,       // JS cannot read this — prevents XSS theft
      secure: true,         // Only sent over HTTPS
      sameSite: 'lax',      // CSRF protection
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Teacher auth error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Logout — clear the cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set(TEACHER_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
