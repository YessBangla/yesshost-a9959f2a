import { useEffect, useState } from "react";
import { MessageCircle, Plus, Trash2, Edit2, CheckCircle, XCircle, Clock, Users, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type Room = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type Member = {
  id: string;
  room_id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile_name?: string;
  profile_email?: string;
};

const AdminChatRooms = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);

  const fetchRooms = async () => {
    const { data } = await supabase.from("chat_rooms").select("*").order("created_at");
    setRooms((data as Room[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  // Fetch members when room selected
  useEffect(() => {
    if (!selectedRoom) { setMembers([]); return; }
    const fetchMembers = async () => {
      const { data: memberData } = await supabase
        .from("chat_room_members")
        .select("*")
        .eq("room_id", selectedRoom.id)
        .order("created_at");

      if (!memberData || memberData.length === 0) { setMembers([]); return; }

      const userIds = memberData.map((m: any) => m.user_id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap: Record<string, string> = {};
      (profileData || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name || "User"; });

      setMembers(memberData.map((m: any) => ({
        ...m,
        profile_name: profileMap[m.user_id] || "User",
      })));
    };
    fetchMembers();
  }, [selectedRoom?.id]);

  const openCreateForm = () => {
    setEditingRoom(null);
    setFormName("");
    setFormDesc("");
    setFormActive(true);
    setShowForm(true);
  };

  const openEditForm = (room: Room) => {
    setEditingRoom(room);
    setFormName(room.name);
    setFormDesc(room.description || "");
    setFormActive(room.is_active);
    setShowForm(true);
  };

  const saveRoom = async () => {
    if (!formName.trim()) return;
    if (editingRoom) {
      await supabase.from("chat_rooms").update({ name: formName.trim(), description: formDesc.trim() || null, is_active: formActive }).eq("id", editingRoom.id);
      toast.success(bn ? "রুম আপডেট হয়েছে" : "Room updated");
    } else {
      await supabase.from("chat_rooms").insert({ name: formName.trim(), description: formDesc.trim() || null, is_active: formActive });
      toast.success(bn ? "রুম তৈরি হয়েছে" : "Room created");
    }
    setShowForm(false);
    fetchRooms();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm(bn ? "এই রুম মুছে ফেলবেন?" : "Delete this room?")) return;
    await supabase.from("chat_rooms").delete().eq("id", id);
    if (selectedRoom?.id === id) setSelectedRoom(null);
    toast.success(bn ? "রুম মুছে ফেলা হয়েছে" : "Room deleted");
    fetchRooms();
  };

  const updateMemberStatus = async (memberId: string, status: "approved" | "rejected") => {
    await supabase.from("chat_room_members").update({ status }).eq("id", memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
    toast.success(status === "approved" ? (bn ? "অনুমোদিত" : "Approved") : (bn ? "বাতিল করা হয়েছে" : "Rejected"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bn ? "চ্যাট রুম ম্যানেজমেন্ট" : "Chat Room Management"}</h1>
          <p className="text-sm text-muted-foreground">{bn ? "রুম তৈরি, সম্পাদনা এবং সদস্য অনুমোদন করুন" : "Create, edit rooms and manage member approvals"}</p>
        </div>
        <Button onClick={openCreateForm} size="sm">
          <Plus className="w-4 h-4 mr-1" /> {bn ? "নতুন রুম" : "New Room"}
        </Button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="glass-card rounded-xl p-4 border border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editingRoom ? (bn ? "রুম সম্পাদনা" : "Edit Room") : (bn ? "নতুন রুম তৈরি" : "Create New Room")}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-sm hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={bn ? "রুমের নাম *" : "Room name *"}
            className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
          />
          <input
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder={bn ? "বিবরণ (ঐচ্ছিক)" : "Description (optional)"}
            className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
          />
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded-sm" />
            {bn ? "সক্রিয়" : "Active"}
          </label>
          <Button onClick={saveRoom} size="sm" disabled={!formName.trim()}>
            <Save className="w-4 h-4 mr-1" /> {bn ? "সংরক্ষণ" : "Save"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "400px" }}>
        {/* Room list */}
        <div className="glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border shrink-0">
            <p className="text-sm font-semibold text-foreground">{rooms.length} {bn ? "রুম" : "Rooms"}</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {rooms.map(room => (
              <div
                key={room.id}
                className={`p-3 hover:bg-secondary/50 transition-colors cursor-pointer ${selectedRoom?.id === room.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    {room.name}
                  </span>
                  <Badge variant={room.is_active ? "default" : "secondary"} className="text-[9px]">
                    {room.is_active ? (bn ? "সক্রিয়" : "Active") : (bn ? "নিষ্ক্রিয়" : "Inactive")}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{room.description || "—"}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(room); }} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    <Edit2 className="w-3 h-3" /> {bn ? "সম্পাদনা" : "Edit"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5 ml-2">
                    <Trash2 className="w-3 h-3" /> {bn ? "মুছুন" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
            {rooms.length === 0 && (
              <div className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{bn ? "কোনো রুম নেই" : "No rooms"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Member management */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col">
          {!selectedRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{bn ? "সদস্য দেখতে একটি রুম নির্বাচন করুন" : "Select a room to manage members"}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border shrink-0">
                <p className="text-sm font-bold text-foreground">{selectedRoom.name} — {bn ? "সদস্যরা" : "Members"}</p>
                <p className="text-[10px] text-muted-foreground">{members.length} {bn ? "জন সদস্য" : "members"}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {members.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{bn ? "কোনো সদস্যের অনুরোধ নেই" : "No member requests yet"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {members.map(m => (
                      <div key={m.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.profile_name}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateMemberStatus(m.id, "approved")}
                                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                title={bn ? "অনুমোদন" : "Approve"}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateMemberStatus(m.id, "rejected")}
                                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                title={bn ? "বাতিল" : "Reject"}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <Badge
                            variant={m.status === "approved" ? "default" : m.status === "rejected" ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {m.status === "approved" ? (bn ? "অনুমোদিত" : "Approved") : m.status === "rejected" ? (bn ? "বাতিল" : "Rejected") : (bn ? "অপেক্ষমাণ" : "Pending")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatRooms;
