import { NextRequest, NextResponse } from 'next/server';
import { getRun, updateRun, deleteRun } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await getRun(id);

    if (!run) {
      return NextResponse.json(
        { error: `Run with id ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ run });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch run' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, status } = body;

    const run = await updateRun(id, { title, status });
    if (!run) {
      return NextResponse.json(
        { error: `Run with id ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ run });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update run' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteRun(id);

    if (!success) {
      return NextResponse.json(
        { error: `Run with id ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Run deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete run' },
      { status: 500 }
    );
  }
}
