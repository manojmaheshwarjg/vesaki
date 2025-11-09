import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, swipes, collectionItems, collections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, direction, sessionId, cardPosition } = body;

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save swipe to database
    await db.insert(swipes).values({
      userId: user.id,
      productId,
      direction: direction as 'left' | 'right' | 'up',
      sessionId,
      cardPosition,
    });

    // If swipe right (like), add to default collection
    if (direction === 'right') {
      const defaultCollection = await db.query.collections.findFirst({
        where: and(
          eq(collections.userId, user.id),
          eq(collections.isDefault, true)
        ),
      });

      if (defaultCollection) {
        // Check if item already exists in collection
        const existing = await db.query.collectionItems.findFirst({
          where: and(
            eq(collectionItems.collectionId, defaultCollection.id),
            eq(collectionItems.productId, productId)
          ),
        });

        if (!existing) {
          await db.insert(collectionItems).values({
            collectionId: defaultCollection.id,
            productId,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Swipe recorded successfully',
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's swipes
    const userSwipes = await db.query.swipes.findMany({
      where: eq(swipes.userId, user.id),
      with: {
        product: true,
      },
      orderBy: (swipes, { desc }) => [desc(swipes.swipedAt)],
    });

    return NextResponse.json({
      swipes: userSwipes,
      message: 'Swipe history retrieved',
    });
  } catch (error) {
    console.error('Error fetching swipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swipes' },
      { status: 500 }
    );
  }
}
