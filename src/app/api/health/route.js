import { testConnection } from '@/lib/db/mysql';

export async function GET() {
  try {
    const result = await testConnection();

    return Response.json({
      success: true,
      database: result,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
