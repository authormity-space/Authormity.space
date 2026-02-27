export interface Profile {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    linkedin_id: string | null;
    linkedin_access_token: string | null;
    linkedin_token_expires_at: string | null;
    credits: number;
    plan: 'free' | 'pro' | 'team';
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: string;
    user_id: string;
    content: string;
    media_url: string | null;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduled_at: string | null;
    published_at: string | null;
    linkedin_post_id: string | null;
    impressions: number;
    reactions: number;
    comments: number;
    shares: number;
    created_at: string;
    updated_at: string;
}

export interface VoiceProfile {
    id: string;
    user_id: string;
    name: string;
    style_description: string;
    tone: 'professional' | 'conversational' | 'inspirational' | 'educational' | 'bold';
    sample_posts: string[];
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface Analytics {
    id: string;
    user_id: string;
    post_id: string;
    date: string;
    impressions: number;
    reactions: number;
    comments: number;
    shares: number;
    profile_views: number;
    follower_change: number;
    created_at: string;
}

export interface Team {
    id: string;
    name: string;
    owner_id: string;
    plan: 'team';
    member_limit: number;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
}

export interface CommentTemplate {
    id: string;
    user_id: string;
    label: string;
    content: string;
    category: string;
    usage_count: number;
    created_at: string;
    updated_at: string;
}
