export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  person_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  hidden: boolean;
  created_at: string;
}

export interface Summary {
  id: string;
  person_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ProfileInsight {
  id: string;
  user_id: string;
  category: string;
  text: string;
  created_at: string;
}

export interface AccountLink {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}
