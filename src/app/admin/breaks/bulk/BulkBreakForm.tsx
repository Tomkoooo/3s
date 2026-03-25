"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import type { BreakFormState } from "@/app/my-account/breaks/actions";
import { createBreaksBulkAction } from "@/app/my-account/breaks/actions";
import dayjs from "@/lib/dayjs";

const initialState: BreakFormState = { success: false };

export default function BulkBreakForm({
  users,
}: {
  users: Array<{ _id: string; fullName: string; email: string }>;
}) {
  const [filter, setFilter] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");

  const [state, formAction] = useActionState(createBreaksBulkAction, initialState);

  useEffect(() => {
    if (state.success) {
      redirect("/admin/breaks");
    }
  }, [state.success]);

  const filteredUsers = useMemo(() => {
    const token = filter.trim().toLowerCase();
    if (!token) return users;
    return users.filter((u) => u.fullName.toLowerCase().includes(token) || u.email.toLowerCase().includes(token));
  }, [filter, users]);

  const filteredIds = useMemo(() => filteredUsers.map((u) => u._id), [filteredUsers]);

  const selectFiltered = () => {
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const clearFiltered = () => {
    setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date && endDate && dayjs(endDate).isBefore(dayjs(date), "day")) {
      setEndDate(undefined);
    }
  };

  return (
    <form className="flex flex-col gap-6" action={formAction}>
      {selectedUserIds.map((id) => (
        <input key={id} type="hidden" name="targetUserIds" value={id} />
      ))}

      <div className="flex flex-col gap-2">
        <Label htmlFor="filter">Felhasználók szűrése</Label>
        <Input
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Keresés név vagy email alapján"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={selectFiltered}>
            Szűrt kijelölése
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={clearFiltered}>
            Szűrt törlése
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setSelectedUserIds(users.map((u) => u._id))}>
            Összes kijelölése
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setSelectedUserIds([])}>
            Kijelölés törlése
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Kijelölve: <strong>{selectedUserIds.length}</strong> / {users.length}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[360px] overflow-auto border rounded-md p-3">
          {filteredUsers.map((user) => (
            <label key={user._id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedUserIds.includes(user._id)}
                onCheckedChange={(checked) => {
                  setSelectedUserIds((prev) => {
                    if (checked) return Array.from(new Set([...prev, user._id]));
                    return prev.filter((id) => id !== user._id);
                  });
                }}
              />
              <span>
                {user.fullName} ({user.email})
              </span>
            </label>
          ))}
        </div>
        {selectedUserIds.length === 0 ? (
          <p className="text-sm text-red-600">Legalább egy felhasználót ki kell jelölni</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-1 items-center">
          <Label htmlFor="start">Kezdő dátum</Label>
          <span className="text-sm text-red-600">*</span>
        </div>
        <DatePicker
          selected={startDate}
          onSelect={handleStartDateChange}
          clearable={false}
          dayDisableRule={(date) => dayjs(date).isBefore(dayjs(), "day")}
        />
        <input type="hidden" name="start" value={startDate ? dayjs(startDate).format("YYYY-MM-DD") : ""} />
        {state.success === false && state.fieldErrors?.start?.length ? (
          <p className="text-sm text-red-600">{state.fieldErrors.start[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-1 items-center">
          <Label htmlFor="end">Befejező dátum</Label>
          <span className="text-sm text-muted-foreground">(opcionális)</span>
        </div>
        <DatePicker
          selected={endDate}
          onSelect={setEndDate}
          clearable={true}
          dayDisableRule={(date) => {
            if (dayjs(date).isBefore(dayjs(), "day")) return true;
            if (startDate && dayjs(date).isBefore(dayjs(startDate), "day")) return true;
            return false;
          }}
        />
        <input type="hidden" name="end" value={endDate ? dayjs(endDate).format("YYYY-MM-DD") : ""} />
        {state.success === false && state.fieldErrors?.end?.length ? (
          <p className="text-sm text-red-600">{state.fieldErrors.end[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-1 items-center">
          <Label htmlFor="reason">Indok</Label>
          <span className="text-sm text-muted-foreground">(opcionális)</span>
        </div>
        <Input
          id="reason"
          name="reason"
          placeholder="Szabadság, betegség, stb."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {state.success === false && state.fieldErrors?.reason?.length ? (
          <p className="text-sm text-red-600">{state.fieldErrors.reason[0]}</p>
        ) : null}
      </div>

      {state.success === false && state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.message || "Sikeresen mentve."}</p> : null}

      <div className="flex flex-row gap-2 justify-end">
        <Button variant="outline" type="button" onClick={() => redirect("/admin/breaks")}>
          Mégsem
        </Button>
        <Button type="submit" disabled={selectedUserIds.length === 0 || !startDate}>
          Tömeges rögzítés
        </Button>
      </div>
    </form>
  );
}

