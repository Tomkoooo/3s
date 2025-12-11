import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Audit from "@/lib/db/models/Audit";
import { connectDB } from "@/lib/db";
import { decodeToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = decodeToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await connectDB();

        // For admins, fetch all audits
        // For users, fetch only their audits
        const query = decoded.role === "admin" 
            ? {} 
            : { participants: decoded.id };

        const audits = await Audit.find(query)
            .populate("site", "name")
            .populate("participants", "fullName email")
            .sort({ onDate: 1 })
            .lean();

        return NextResponse.json({
            audits: audits.map((audit: any) => {
                // Calculate status manually (virtual doesn't work with lean)
                let status: "scheduled" | "in_progress" | "completed" = "scheduled";
                if (audit.startTime && audit.endTime) {
                    status = "completed";
                } else if (audit.startTime) {
                    status = "in_progress";
                }

                return {
                    _id: audit._id.toString(),
                    status,
                    onDate: audit.onDate,
                    site: audit.site ? {
                        _id: audit.site._id.toString(),
                        name: audit.site.name,
                    } : null,
                    participants: audit.participants?.map((p: any) => ({
                        _id: p._id.toString(),
                        fullName: p.fullName,
                        email: p.email,
                    })) || [],
                };
            }),
        });
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return NextResponse.json(
            { error: "Failed to fetch calendar data" },
            { status: 500 }
        );
    }
}

