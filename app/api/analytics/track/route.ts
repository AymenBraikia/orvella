import { collected_data_collection } from "@/app/db/collections";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("analytics_session_id")?.value;

        const { name, path, time_spent_seconds, scroll_y, clicks } = await req.json();

        // Validate payload
        if (
            typeof name !== "string" ||
            !name ||
            name.length > 200 ||
            typeof sessionId !== "string" ||
            !sessionId ||
            sessionId.length > 100 ||
            typeof path !== "string" ||
            !path.startsWith("/") ||
            path.length > 2048 ||
            !Number.isFinite(time_spent_seconds) ||
            time_spent_seconds <= 0 ||
            time_spent_seconds > 1800 ||
            !Number.isFinite(scroll_y) ||
            scroll_y < 0 ||
            typeof clicks != "number" ||
            clicks < 0
        ) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const collection = await collected_data_collection();

        // Only update an existing demo and an existing session.
        const result = await collection.updateOne(
            {
                name,
                visits: {
                    $elemMatch: {
                        session_id: sessionId,
                    },
                },
            },
            [
                {
                    $set: {
                        visits: {
                            $map: {
                                input: "$visits",
                                as: "visit",
                                in: {
                                    $cond: [
                                        {
                                            $eq: ["$$visit.session_id", { $literal: sessionId }],
                                        },
                                        {
                                            $mergeObjects: [
                                                "$$visit",
                                                {
                                                    visited_paths: {
                                                        $let: {
                                                            vars: {
                                                                paths: {
                                                                    $ifNull: ["$$visit.visited_paths", []],
                                                                },
                                                            },
                                                            in: {
                                                                $cond: [
                                                                    {
                                                                        $in: [
                                                                            { $literal: path },
                                                                            {
                                                                                $map: {
                                                                                    input: "$$paths",
                                                                                    as: "p",
                                                                                    in: "$$p.path",
                                                                                },
                                                                            },
                                                                        ],
                                                                    },

                                                                    // Update existing path.
                                                                    {
                                                                        $map: {
                                                                            input: "$$paths",
                                                                            as: "p",
                                                                            in: {
                                                                                $cond: [
                                                                                    {
                                                                                        $eq: ["$$p.path", { $literal: path }],
                                                                                    },
                                                                                    {
                                                                                        $mergeObjects: [
                                                                                            "$$p",
                                                                                            {
                                                                                                time_spent_seconds: {
                                                                                                    $add: [
                                                                                                        {
                                                                                                            $ifNull: ["$$p.time_spent_seconds", 0],
                                                                                                        },
                                                                                                        { $literal: time_spent_seconds },
                                                                                                    ],
                                                                                                },
                                                                                                scroll_y: {
                                                                                                    $max: [
                                                                                                        {
                                                                                                            $ifNull: ["$$p.scroll_y", 0],
                                                                                                        },
                                                                                                        { $literal: scroll_y },
                                                                                                    ],
                                                                                                },
                                                                                                clicks: {
                                                                                                    $max: [
                                                                                                        {
                                                                                                            $ifNull: ["$$p.clicks", 0],
                                                                                                        },
                                                                                                        { $literal: clicks },
                                                                                                    ],
                                                                                                },
                                                                                            },
                                                                                        ],
                                                                                    },
                                                                                    "$$p",
                                                                                ],
                                                                            },
                                                                        },
                                                                    },

                                                                    // Insert new path.
                                                                    {
                                                                        $concatArrays: [
                                                                            "$$paths",
                                                                            [
                                                                                {
                                                                                    path: {
                                                                                        $literal: path,
                                                                                    },
                                                                                    time_spent_seconds: {
                                                                                        $literal: time_spent_seconds,
                                                                                    },
                                                                                    scroll_y: {
                                                                                        $literal: scroll_y,
                                                                                    },
                                                                                },
                                                                            ],
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                        "$$visit",
                                    ],
                                },
                            },
                        },
                    },
                },
            ],
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Demo or session not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Analytics tracking error:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
