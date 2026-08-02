import type { SupabaseClient } from "@supabase/supabase-js";
import type { FollowStatus, ProfileRow } from "@/lib/supabase/types";

const FOLLOW_REQUEST_NOTIFICATION_TYPE = "follow_request" as const;
const FOLLOW_NOTIFICATION_TYPE = "follow" as const;
const REQUEST_ACCEPTED_NOTIFICATION_TYPE = "request_accepted" as const;

type FollowActionResult = {
  success: boolean;
  errorMessage?: string;
};

export type PendingFollowRequest = {
  requesterId: string;
  requestedAt: string;
  profile: ProfileRow;
};

const GENERIC_NETWORK_ERROR = "Network error. Please check your connection and try again.";

async function getProfileName(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name || "Someone";
}

async function createNotification(
  supabase: SupabaseClient,
  recipientUserId: string,
  senderUserId: string,
  type: "follow" | "follow_request" | "request_accepted",
  message: string
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: recipientUserId,
    sender_id: senderUserId,
    type,
    message,
  });

  if (error) {
    console.error("createNotification notification insert error:", error);
    return false;
  }

  console.log("NOTIFICATION CREATED");
  return true;
}

export async function resolveFollowStatus(
  supabase: SupabaseClient,
  viewerId: string | null,
  targetId: string
): Promise<FollowStatus> {
  if (!viewerId || viewerId === targetId) return "none";

  try {
    const [{ data: followRow }, { data: requestRow }] = await Promise.all([
      supabase
        .from("followers")
        .select("follower_id")
        .eq("follower_id", viewerId)
        .eq("following_id", targetId)
        .maybeSingle(),
      supabase
        .from("follow_requests")
        .select("status")
        .eq("requester_id", viewerId)
        .eq("target_id", targetId)
        .eq("status", "pending")
        .maybeSingle(),
    ]);

    if (followRow) return "following";
    if (requestRow) return "requested";
    return "none";
  } catch (error) {
    console.error("resolveFollowStatus error:", error);
    return "none";
  }
}

export async function resolveFollowStatuses(
  supabase: SupabaseClient,
  viewerId: string | null,
  targetIds: string[]
): Promise<Record<string, FollowStatus>> {
  const statusMap: Record<string, FollowStatus> = {};
  targetIds.forEach((id) => {
    statusMap[id] = "none";
  });

  if (!viewerId || targetIds.length === 0) return statusMap;

  try {
    const [{ data: followRows }, { data: requestRows }] = await Promise.all([
      supabase.from("followers").select("following_id").eq("follower_id", viewerId).in("following_id", targetIds),
      supabase
        .from("follow_requests")
        .select("target_id")
        .eq("requester_id", viewerId)
        .eq("status", "pending")
        .in("target_id", targetIds),
    ]);

    (followRows ?? []).forEach((row: { following_id: string }) => {
      statusMap[row.following_id] = "following";
    });
    (requestRows ?? []).forEach((row: { target_id: string }) => {
      if (statusMap[row.target_id] !== "following") {
        statusMap[row.target_id] = "requested";
      }
    });

    return statusMap;
  } catch (error) {
    console.error("resolveFollowStatuses error:", error);
    return statusMap;
  }
}

export async function followPublicUser(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string
): Promise<FollowActionResult> {
  if (followerId === followingId) {
    return { success: false, errorMessage: "You can't follow yourself." };
  }

  try {
    const { error } = await supabase
      .from("followers")
      .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: "follower_id,following_id" });

    if (error) {
      console.error("followPublicUser error:", error);
      return { success: false, errorMessage: "Could not follow this user." };
    }

    console.log("FOLLOWER INSERT SUCCESS");

    const followerName = await getProfileName(supabase, followerId);
    const followNotificationCreated = await createNotification(
      supabase,
      followingId,
      followerId,
      FOLLOW_NOTIFICATION_TYPE,
      `${followerName} started following you`
    );

    if (!followNotificationCreated) {
      console.error("Public follow notification failed but follow succeeded.");
    }

    return { success: true };
  } catch (error) {
    console.error("followPublicUser network error:", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function unfollowUser(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string
): Promise<FollowActionResult> {
  try {
    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      console.error("unfollowUser error:", error);
      return { success: false, errorMessage: "Could not unfollow this user." };
    }

    return { success: true };
  } catch (error) {
    console.error("unfollowUser network error:", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function sendFollowRequest(
  supabase: SupabaseClient,
  requesterId: string,
  targetId: string
): Promise<FollowActionResult> {
  if (requesterId === targetId) {
    return { success: false, errorMessage: "You can't follow yourself." };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("AUTH USER:", user?.id);
    console.log("REQUESTER:", requesterId);
    console.log("TARGET:", targetId);

    const { error } = await supabase
      .from("follow_requests")
      .upsert(
        { requester_id: requesterId, target_id: targetId, status: "pending" },
        { onConflict: "requester_id,target_id" }
      );

    if (error) {
      console.error("sendFollowRequest error:", error);
      return { success: false, errorMessage: "Could not send follow request." };
    }

    console.log("FOLLOW REQUEST UPDATED");

    const requesterName = await getProfileName(supabase, requesterId);
    const requestNotificationCreated = await createNotification(
      supabase,
      targetId,
      requesterId,
      FOLLOW_REQUEST_NOTIFICATION_TYPE,
      `${requesterName} requested to follow you`
    );

    if (!requestNotificationCreated) {
      console.error("Private follow request notification failed but request succeeded.");
    }

    return { success: true };
  } catch (error) {
    console.error("sendFollowRequest network error:", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function cancelFollowRequest(
  supabase: SupabaseClient,
  requesterId: string,
  targetId: string
): Promise<FollowActionResult> {
  try {
    const { error } = await supabase
      .from("follow_requests")
      .delete()
      .eq("requester_id", requesterId)
      .eq("target_id", targetId);

    if (error) {
      console.error("cancelFollowRequest error:", error);
      return { success: false, errorMessage: "Could not cancel your request." };
    }

    console.log("FOLLOW REQUEST DELETED");
    return { success: true };
  } catch (error) {
    console.error("cancelFollowRequest network error:", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function removeFollower(
  supabase: SupabaseClient,
  ownerId: string,
  followerId: string
): Promise<FollowActionResult> {
  try {
    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", ownerId);

    if (error) {
      console.error("removeFollower error:", error);
      return { success: false, errorMessage: "Could not remove this follower." };
    }

    return { success: true };
  } catch (error) {
    console.error("removeFollower network error:", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function acceptFollowRequest(
  supabase: SupabaseClient,
  ownerId: string,
  requesterId: string
): Promise<FollowActionResult> {
  try {
    const { error: followError } = await supabase.from("followers").insert({
      follower_id: requesterId,
      following_id: ownerId,
    });

    if (followError) {
      const isDuplicateFollower = followError.code === "23505" || /duplicate key|already exists/i.test(followError.message);

      if (isDuplicateFollower) {
        console.log("FOLLOWER ALREADY EXISTS");
      } else {
        console.error("FOLLOW INSERT ERROR", followError);
        return { success: false, errorMessage: "Could not accept this request." };
      }
    } else {
      console.log("FOLLOWER INSERT SUCCESS");
    }

    const { error: updateError } = await supabase
      .from("follow_requests")
      .update({ status: "accepted" })
      .eq("requester_id", requesterId)
      .eq("target_id", ownerId);

    if (updateError) {
      console.error("ACCEPT FAILED", updateError);
      return { success: false, errorMessage: "Accepted, but could not clear the request." };
    }

    console.log("FOLLOW REQUEST UPDATED");

    const ownerName = await getProfileName(supabase, ownerId);
    const notificationCreated = await createNotification(
      supabase,
      requesterId,
      ownerId,
      REQUEST_ACCEPTED_NOTIFICATION_TYPE,
      `${ownerName} accepted your follow request`
    );

    if (!notificationCreated) {
      console.error("ACCEPT FAILED", "notification creation failed after follower insert and request update succeeded");
    }

    return { success: true };
  } catch (error) {
    console.error("ACCEPT FAILED", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function rejectFollowRequest(
  supabase: SupabaseClient,
  ownerId: string,
  requesterId: string
): Promise<FollowActionResult> {
  try {
    const { error } = await supabase
      .from("follow_requests")
      .update({ status: "rejected" })
      .eq("requester_id", requesterId)
      .eq("target_id", ownerId);

    if (error) {
      console.error("rejectFollowRequest error:", error);
      return { success: false, errorMessage: "Could not reject this request." };
    }

    return { success: true };
  } catch (error) {
    console.error("rejectFollowRequest network error:", error);
    return { success: false, errorMessage: GENERIC_NETWORK_ERROR };
  }
}

export async function getPendingRequests(
  supabase: SupabaseClient,
  ownerId: string
): Promise<PendingFollowRequest[]> {
  try {
    const { data: requestRows, error: requestError } = await supabase
      .from("follow_requests")
      .select("requester_id, created_at")
      .eq("target_id", ownerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestError) {
      console.error("getPendingRequests error:", requestError);
      return [];
    }

    const rows = requestRows ?? [];
    if (rows.length === 0) return [];

    const requesterIds = rows.map((r: { requester_id: string }) => r.requester_id);

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", requesterIds);

    if (profilesError) {
      console.error("getPendingRequests profiles error:", profilesError);
      return [];
    }

    const profileMap = new Map<string, ProfileRow>(
      (profilesData ?? []).map((p: ProfileRow) => [p.id, p])
    );

    return rows
      .filter((r: { requester_id: string }) => profileMap.has(r.requester_id))
      .map((r: { requester_id: string; created_at: string }) => ({
        requesterId: r.requester_id,
        requestedAt: r.created_at,
        profile: profileMap.get(r.requester_id) as ProfileRow,
      }));
  } catch (error) {
    console.error("getPendingRequests network error:", error);
    return [];
  }
}

export async function getFollowerCount(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("followers")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId);

    if (error) {
      console.error("getFollowerCount error:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("getFollowerCount network error:", error);
    return 0;
  }
}

export async function getFollowingCount(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("followers")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (error) {
      console.error("getFollowingCount error:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("getFollowingCount network error:", error);
    return 0;
  }
}