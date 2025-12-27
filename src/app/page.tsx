"use client";

import { useState, useEffect } from "react";
import { User, Item, ItemType } from "@/types";
import { Plus, Trash2, Clock, Hand } from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { ja } from "date-fns/locale";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");

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
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("line-item-mgt-users", JSON.stringify(users));
  }, [users]);

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

  return (
    <main className="min-h-screen p-8 bg-neutral-50 text-neutral-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-slate-800">LINE アイテム管理</h1>

        {/* User Addition Input */}
        <div className="flex gap-4 mb-10 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="新しいユーザー名"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="space-y-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-700">{user.name}</h2>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="ユーザーを削除"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 flex gap-3">
                  <button
                    onClick={() => addItem(user.id, 'Glove')}
                    className="flex-1 py-2 px-4 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Hand size={18} />
                    グローブを追加
                  </button>
                  <button
                    onClick={() => addItem(user.id, 'Time')}
                    className="flex-1 py-2 px-4 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Clock size={18} />
                    タイムを追加
                  </button>
                </div>

                {user.items.length === 0 ? (
                  <p className="text-neutral-400 text-center py-4 text-sm">アイテムを持っていません</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {user.items.map((item) => {
                      const isExpired = Date.now() > item.expiresAt;

                      return (
                        <div
                          key={item.id}
                          className={`flex justify-between items-center p-3 rounded-lg border ${isExpired ? 'bg-neutral-100 border-neutral-200 opacity-60' :
                            item.type === 'Glove' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                            }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                              {item.type === 'Glove' ? <Hand size={16} className="text-emerald-600" /> : <Clock size={16} className="text-amber-600" />}
                              {item.type === 'Glove' ? 'グローブ' : 'タイム'}
                              {isExpired && <span className="text-xs bg-neutral-500 text-white px-1.5 py-0.5 rounded">期限切れ</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              有効期限: {format(item.expiresAt, 'MM/dd HH:mm', { locale: ja })}
                            </div>
                          </div>
                          <button
                            onClick={() => useItem(user.id, item.id)}
                            className="bg-white border border-neutral-200 text-slate-600 text-xs px-3 py-1.5 rounded hover:bg-slate-50 transition-colors pointer-events-auto"
                          >
                            使用する
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
