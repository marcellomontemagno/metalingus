"use client";

import { useState } from "react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { gradeSchema } from "@/lib/model/Grade";
import { shapeSchema } from "@/lib/model/Shape";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import { produce } from "immer";
import { useStore, setStore } from "@/lib/store/store";
import { createInquiryApi, updateInquiryApi } from "@/lib/api/inquiryApi";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import createInquiry from "@/lib/model/inquiry/createInquiry";
import EnumCombobox from "@/components/EnumCombobox";
import DatePicker from "./DatePicker";

type FormState = Record<keyof Inquiry, string>;

const toForm = (i: Inquiry): FormState =>
  Object.fromEntries(
    Object.entries(i).map(([k, v]) => [k, v ? String(v) : ""]),
  ) as FormState;

const EMPTY = toForm(createInquiry());

export default function InquiryFormDialog({
  open,
  onOpenChange,
  inquiryId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiryId?: string | null;
  onSaved: () => void;
}) {
  const inquiry = useStore((s) => (inquiryId ? s.entities.inquiry[inquiryId] : null));
  const [form, setForm] = useState<FormState>(inquiry ? toForm(inquiry) : EMPTY);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof Inquiry, string>>
  >({});

  const clearError = (key: keyof Inquiry) => {
    setFieldErrors((e) => {
      if (!(key in e)) return e;
      const rest = { ...e };
      delete rest[key];
      return rest;
    });
  };

  const set = (key: keyof FormState) => (value: string) => {
    clearError(key);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const single = form.shape === "ROUND" || form.shape === "SQUARE";

  const setShape = (shape: string) => {
    clearError("shape");
    setForm((f) => ({
      ...f,
      shape,
      height: shape === "ROUND" || shape === "SQUARE" ? f.width : f.height,
    }));
  };

  const setDimension = (value: string) => {
    clearError("width");
    setForm((f) => ({ ...f, width: value, height: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: Inquiry = {
      id: inquiry?.id ?? crypto.randomUUID(),
      barsRequested: Number(form.barsRequested),
      latestDeliveryDate: form.latestDeliveryDate || null,
      grade: form.grade as Inquiry["grade"],
      shape: form.shape as Inquiry["shape"],
      width: Number(form.width),
      height: Number(form.height),
      thickness: Number(form.thickness),
      notes: form.notes || null,
      userId: inquiry?.userId ?? null,
    };

    const result = inquirySchema.safeParse(payload);
    if (!result.success) {
      const errors: Partial<Record<keyof Inquiry, string>> = {};
      for (const issue of result.error.issues) {
        const key = (
          single && issue.path[0] === "height" ? "width" : issue.path[0]
        ) as keyof Inquiry;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    setStore(
      produce((draft) => {
        draft.entities.inquiry[payload.id] = payload;
      }),
    );

    onSaved();

    if (inquiry) {
      await updateInquiryApi(payload);
    } else {
      await createInquiryApi(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{inquiryId ? "Edit inquiry" : "New inquiry"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="contents">
          <DialogBody className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="barsRequested">Bars requested</Label>
            <Input
              id="barsRequested"
              type="number"
              value={form.barsRequested}
              onChange={(e) => set("barsRequested")(e.target.value)}
            />
            <FieldError>{fieldErrors.barsRequested}</FieldError>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Grade</Label>
            <EnumCombobox
              options={[...gradeSchema.options]}
              value={form.grade || null}
              onValueChange={set("grade")}
              placeholder="Select grade"
            />
            <FieldError>{fieldErrors.grade}</FieldError>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Shape</Label>
            <EnumCombobox
              options={[...shapeSchema.options]}
              value={form.shape || null}
              onValueChange={setShape}
              placeholder="Select shape"
            />
            <FieldError>{fieldErrors.shape}</FieldError>
          </div>

          {single ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="width">
                {form.shape === "ROUND" ? "Diameter (mm)" : "Side (mm)"}
              </Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={form.width}
                onChange={(e) => setDimension(e.target.value)}
              />
              <FieldError>{fieldErrors.width}</FieldError>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="width">Width (mm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  value={form.width}
                  onChange={(e) => set("width")(e.target.value)}
                />
                <FieldError>{fieldErrors.width}</FieldError>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="height">Height (mm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  value={form.height}
                  onChange={(e) => set("height")(e.target.value)}
                />
                <FieldError>{fieldErrors.height}</FieldError>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="thickness">Thickness (mm)</Label>
            <Input
              id="thickness"
              type="number"
              step="0.01"
              value={form.thickness}
              onChange={(e) => set("thickness")(e.target.value)}
            />
            <FieldError>{fieldErrors.thickness}</FieldError>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Latest delivery date</Label>
            <DatePicker
              value={form.latestDeliveryDate}
              onChange={set("latestDeliveryDate")}
              placeholder="Pick a date"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
            />
          </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
