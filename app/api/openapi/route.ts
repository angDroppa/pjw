import { generateOpenApiDocument } from "@/lib/swagger";
import { NextResponse } from "next/server";

export async function GET() {
  const doc = generateOpenApiDocument();
  return NextResponse.json(doc);
}