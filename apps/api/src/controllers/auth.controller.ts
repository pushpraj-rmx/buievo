import { Request, Response } from 'express';
import prisma from '@repo/db';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body; // Assuming email and password are sent in the request body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // In a real application, you would compare hashed passwords here
    // For now, a simple check
    if (password !== 'password') { // Placeholder: Replace with actual password comparison
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body; // Assuming email, password, and name are sent in the request body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // In a real application, you would hash the password before saving
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        // In a real app, store hashed password: passwordHash: await hashPassword(password),
      },
    });

    res.status(201).json({ message: 'Registration successful', user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
