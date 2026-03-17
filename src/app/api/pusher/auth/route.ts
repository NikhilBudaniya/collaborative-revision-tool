import { pusherServer } from '@/lib/pusher-server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;
    
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || 'ANONYMOUS';
    const orgId = cookieStore.get('orgId')?.value;

    if (!orgId) {
      return new NextResponse('Unauthorized: Missing orgId', { status: 401 });
    }

    // Security: Ensure the user is only subscribing to their own organization's channel
    const expectedChannel = `private-org-${orgId}`;
    if (channelName !== expectedChannel) {
      return new NextResponse('Unauthorized: Channel mismatch', { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: { orgId },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher Auth Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
