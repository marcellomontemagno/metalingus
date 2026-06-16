"use client";

import { useState } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { produce } from "immer";
import { useStore, setStore } from "@/lib/store/store";
import { useAsync } from "react-async-hook";
import { getInquiries, deleteInquiryApi } from "@/lib/api/inquiryApi";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import InquiryFormDialog from "./InquiryFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import createCode from "@/lib/utils/createCode";

function dimensions(i: Inquiry) {
  if (i.shape === "ROUND") return `Ø${i.height}`;
  if (i.shape === "SQUARE") return `${i.width}`;
  return `${i.width} × ${i.height}`;
}

function deliveryDate(value: string | null) {
  if (!value) return "—";
  // value is 'YYYY-MM-DD'; parse as local midnight so it doesn't shift a day in
  // negative-UTC timezones.
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export default function InquiriesPage() {

  const {loading} = useAsync(getInquiries, [], {
    onSuccess: (data) => {
      setStore(
        produce((s) => {
          data.forEach((i) => {
            s.entities.inquiry[i.id] = i;
          });
        }),
      );
    },
  });

  const inquiriesMap = useStore((s) => s.entities.inquiry);
  const inquiries = Object.values(inquiriesMap);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <main className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Inquiries</CardTitle>
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setFormOpen(true);
              }}
            >
              New inquiry
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : inquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Bars</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Dimensions (mm)</TableHead>
                  <TableHead>Thickness (mm)</TableHead>
                  <TableHead>Latest delivery</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell data-label="Code">{createCode(inquiry)}</TableCell>
                    <TableCell data-label="Bars">{inquiry.barsRequested}</TableCell>
                    <TableCell data-label="Grade">{inquiry.grade}</TableCell>
                    <TableCell data-label="Shape">{inquiry.shape}</TableCell>
                    <TableCell data-label="Dimensions (mm)">
                      {dimensions(inquiry)}
                    </TableCell>
                    <TableCell data-label="Thickness (mm)">
                      {inquiry.thickness}
                    </TableCell>
                    <TableCell data-label="Latest delivery">
                      {deliveryDate(inquiry.latestDeliveryDate)}
                    </TableCell>
                    <TableCell
                      data-label="Notes"
                      className="text-muted-foreground"
                    >
                      {inquiry.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right max-md:before:hidden">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(inquiry.id);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingId(inquiry.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InquiryFormDialog
        key={String(formOpen)}
        open={formOpen}
        onOpenChange={setFormOpen}
        inquiryId={editingId}
        onSaved={() => {
          setFormOpen(false);
        }}
      />

      <DeleteConfirmDialog
        isOpen={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete inquiry?"
        description="This permanently removes the inquiry. This action cannot be undone."
        onConfirm={async ()=>{
          if (!deletingId) return;
          setStore(
            produce((draft) => {
              delete draft.entities.inquiry[deletingId];
            }),
          );
          setDeletingId(null);
          await deleteInquiryApi(deletingId);
        }}
      />
    </main>
  );
}
