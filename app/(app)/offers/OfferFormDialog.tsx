"use client";

import { useEffect, useState } from "react";

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
import { currencySchema } from "@/lib/model/Currency";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";
import createOffer from "@/lib/model/offer/createOffer";
import EnumCombobox from "@/components/EnumCombobox";

type FormState = Record<keyof Offer, string>;

const toForm = (o: Offer): FormState =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, v ? String(v) : ""]),
  ) as FormState;

const EMPTY = toForm(createOffer());

export default function OfferFormDialog({
  open,
  onOpenChange,
  offer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: Offer | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof Offer, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(offer ? toForm(offer) : EMPTY);
      setFieldErrors({});
      setFormError(null);
    }
  }, [open, offer]);

  const clearError = (key: keyof Offer) => {
    setFieldErrors((e) => {
      if (!(key in e)) return e;
      const rest = { ...e };
      delete rest[key];
      return rest;
    });
    setFormError(null);
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

    const payload: Offer = {
      id: offer?.id ?? crypto.randomUUID(),
      barsAvailable: Number(form.barsAvailable),
      grade: form.grade as Offer["grade"],
      shape: form.shape as Offer["shape"],
      width: Number(form.width),
      height: Number(form.height),
      thickness: Number(form.thickness),
      barsPerBundle: Number(form.barsPerBundle),
      weightPerMeter: Number(form.weightPerMeter),
      pricePerMeter: Number(form.pricePerMeter),
      currency: form.currency as Offer["currency"],
      notes: form.notes || null,
      userId: null,
    };

    const result = offerSchema.safeParse(payload);
    if (!result.success) {
      const errors: Partial<Record<keyof Offer, string>> = {};
      for (const issue of result.error.issues) {
        const key = (
          single && issue.path[0] === "height" ? "width" : issue.path[0]
        ) as keyof Offer;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    setFieldErrors({});
    setFormError(null);

    const res = await fetch(
      offer ? `/api/offers/${offer.id}` : "/api/offers",
      {
        method: offer ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setPending(false);
    if (res.ok) {
      onSaved();
    } else {
      setFormError((await res.text()) || "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{offer ? "Edit offer" : "New offer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="contents">
          <DialogBody className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="barsAvailable">Bars available</Label>
            <Input
              id="barsAvailable"
              type="number"
              value={form.barsAvailable}
              onChange={(e) => set("barsAvailable")(e.target.value)}
            />
            <FieldError>{fieldErrors.barsAvailable}</FieldError>
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
            <Label htmlFor="barsPerBundle">Bars per bundle</Label>
            <Input
              id="barsPerBundle"
              type="number"
              value={form.barsPerBundle}
              onChange={(e) => set("barsPerBundle")(e.target.value)}
            />
            <FieldError>{fieldErrors.barsPerBundle}</FieldError>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weightPerMeter">Weight per meter (kg)</Label>
            <Input
              id="weightPerMeter"
              type="number"
              step="0.0001"
              value={form.weightPerMeter}
              onChange={(e) => set("weightPerMeter")(e.target.value)}
            />
            <FieldError>{fieldErrors.weightPerMeter}</FieldError>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="pricePerMeter">Price per meter</Label>
              <Input
                id="pricePerMeter"
                type="number"
                step="0.0001"
                value={form.pricePerMeter}
                onChange={(e) => set("pricePerMeter")(e.target.value)}
              />
              <FieldError>{fieldErrors.pricePerMeter}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <EnumCombobox
                options={[...currencySchema.options]}
                value={form.currency || null}
                onValueChange={set("currency")}
                placeholder="Select currency"
              />
              <FieldError>{fieldErrors.currency}</FieldError>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
            />
          </div>

          <FieldError>{formError}</FieldError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
