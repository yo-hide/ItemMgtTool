"use client";

import { useState, useEffect } from "react";
import { User, Item, ItemType } from "@/types";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { format, addDays, isAfter, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ja } from "date-fns/locale";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("line-item-mgt-users");
    if (saved) {
      try {
        setUsers(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load users", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("line-item-mgt-users", JSON.stringify(users));
  }, [users, isLoaded]);

  // Check for expired items every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setUsers((currentUsers) => {
        let hasChanges = false;
        const newUsers = currentUsers.map((user) => {
          const activeItems = user.items.filter((item) => item.expiresAt > now);
          if (activeItems.length !== user.items.length) {
            hasChanges = true;
            return { ...user, items: activeItems };
          }
          return user;
        });
        return hasChanges ? newUsers : currentUsers;
      });
      // Force re-render for countdown even if no changes (via state update or specific tick? 
      // Actually setUsers with same identity won't re-render. 
      // We need a tick state to animate the seconds.)
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [, setTick] = useState(0);

  const addUser = () => {
    let nameToUse = newUserName.trim();

    if (!nameToUse) {
      const pattern = /^ユーザー(\d+)$/;
      let maxNum = 0;
      users.forEach((u) => {
        const match = u.name.match(pattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      nameToUse = `ユーザー${nextNum.toString().padStart(2, "0")}`;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: nameToUse,
      items: [],
    };
    setUsers([...users, newUser]);
    setNewUserName("");
  };

  const deleteUser = (userId: string) => {
    if (confirm("ユーザーを削除しますか？")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const renameUser = (userId: string, currentName: string) => {
    const newName = prompt("新しいユーザー名を入力してください", "");
    if (newName && newName.trim()) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, name: newName.trim() } : u)));
    }
  };

  const addItem = (userId: string, type: ItemType) => {
    const now = Date.now();
    const expiresAt = addDays(now, 5).getTime();

    setUsers(users.map(user => {
      if (user.id !== userId) return user;
      const newItem: Item = {
        id: crypto.randomUUID(),
        type,
        acquiredAt: now,
        expiresAt,
      };
      return { ...user, items: [...user.items, newItem] };
    }));
  };

  const useItem = (userId: string, itemId: string) => {
    if (confirm("アイテムを使用（削除）しますか？")) {
      setUsers(users.map(user => {
        if (user.id !== userId) return user;
        return { ...user, items: user.items.filter(i => i.id !== itemId) };
      }));
    }
  };

  const getEarliestGloveExpiry = (user: User) => {
    // Only consider available gloves for sorting priority? Or all gloves including expired?
    // "Expiry is old" implies we care about the date itself.
    // Let's take the minimum expiresAt of any Glove the user holds.
    // If we only cared about active ones, we'd filter by Date.now(). 
    // Assuming we want to see who is expiring soonest.
    const gloves = user.items.filter((i) => i.type === "Glove" && i.expiresAt > Date.now());
    if (gloves.length === 0) return Infinity; // No active gloves -> Last
    return Math.min(...gloves.map((i) => i.expiresAt));
  };

  const sortedUsers = [...users].sort((a, b) => {
    return getEarliestGloveExpiry(a) - getEarliestGloveExpiry(b);
  });

  return (
    <main className="min-h-screen p-8 bg-neutral-50 text-neutral-900 font-sans">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-slate-800">LINE アイテム管理</h1>

        {/* User Addition Input */}
        <div className="flex gap-4 mb-4 bg-white p-6 rounded-xl shadow-sm border border-neutral-200 w-auto inline-flex">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="新しいユーザー名"
            className="w-48 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && addUser()}
          />
          <button
            onClick={addUser}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            追加
          </button>
        </div>

        {/* Users List */}
        <div className="flex flex-col gap-6 w-full">
          {sortedUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-wrap items-center gap-4">
              {/* Left Side: User Info & Actions */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <h2 className="text-xl font-bold text-slate-700 min-w-[120px]">{user.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => renameUser(user.id, user.name)}
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Right Side: Items Management (Glove top, Time bottom) */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                {['Glove', 'Time'].map((type) => {
                  const itemType = type as ItemType;
                  const itemsOfType = user.items.filter(i => i.type === itemType).sort((a, b) => a.acquiredAt - b.acquiredAt);
                  const availableItems = itemsOfType.filter(i => i.expiresAt > Date.now());
                  const expiredItems = itemsOfType.filter(i => i.expiresAt <= Date.now());
                  const count = availableItems.length;

                  return (
                    <div key={type} className="flex items-center gap-4">
                      {/* Add Button */}
                      <button
                        onClick={() => addItem(user.id, itemType)}
                        className={`w-20 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-semibold transition-colors ${itemType === 'Glove'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                      >
                        {itemType === 'Glove' ? <span className="text-base">🥊</span> : <span className="text-base">🕙</span>}
                        追加
                      </button>

                      {/* Info Panel */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg border min-w-[200px] ${itemType === 'Glove' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                        }`}>
                        {/* Count */}
                        <span className="text-lg bg-white px-3 py-0.5 rounded border border-neutral-200 font-bold min-w-[3rem] text-center">
                          {count}
                        </span>

                        <div className="flex-1 min-w-0">
                          {/* Expiry Info */}
                          {count > 0 ? (() => {
                            const expiry = availableItems[0].expiresAt;
                            const now = Date.now();
                            const days = differenceInDays(expiry, now);
                            const hours = differenceInHours(expiry, now) % 24;
                            const minutes = differenceInMinutes(expiry, now) % 60;
                            return (
                              <div className="text-xs text-slate-600 font-medium truncate">
                                残り <span className="text-base font-bold">{days}</span>D <span className="text-base font-bold">{hours}</span>h <span className="text-base font-bold">{minutes}</span>m
                              </div>
                            );
                          })() : (
                            <div className="text-xs text-slate-400">未使用</div>
                          )}

                          {/* Expired Warning */}
                          {expiredItems.length > 0 && (
                            <div className="text-[10px] text-red-500 flex items-center gap-1">
                              期限切れ: {expiredItems.length}
                              <button
                                onClick={() => {
                                  if (confirm("期限切れアイテムを全て削除しますか？")) {
                                    setUsers(users.map(u => {
                                      if (u.id !== user.id) return u;
                                      return { ...u, items: u.items.filter(i => !(i.type === itemType && i.expiresAt <= Date.now())) };
                                    }));
                                  }
                                }}
                                className="underline hover:text-red-700"
                              >
                                削除
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Use Button */}
                        <button
                          onClick={() => {
                            if (count > 0) useItem(user.id, availableItems[0].id);
                          }}
                          disabled={count === 0}
                          className={`text-sm px-3 py-1.5 rounded border transition-colors shrink-0 ${count > 0
                            ? 'bg-white border-neutral-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                            : 'bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
                            }`}
                        >
                          使用
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-10 text-neutral-400">
              ユーザーがいません。新しいユーザーを追加してください。
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
