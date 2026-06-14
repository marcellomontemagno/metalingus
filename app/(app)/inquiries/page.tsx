"use client";

import { useCallback, useEffect, useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import InquiryFormDialog from "./InquiryFormDialog";
import DeleteInquiryDialog from "./DeleteInquiryDialog";

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
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [deleting, setDeleting] = useState<Inquiry | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries");
      const data: Inquiry[] = await res.json();
      setInquiries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(inquiry: Inquiry) {
    setEditing(inquiry);
    setFormOpen(true);
  }

  return (
    <main className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Inquiries</CardTitle>
          <CardAction>
            <Button size="sm" onClick={openNew}>
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
                {inquiries.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell data-label="Bars">{i.barsRequested}</TableCell>
                    <TableCell data-label="Grade">
                      <Badge variant="secondary">{i.grade}</Badge>
                    </TableCell>
                    <TableCell data-label="Shape">
                      <Badge variant="outline">{i.shape}</Badge>
                    </TableCell>
                    <TableCell data-label="Dimensions (mm)">
                      {dimensions(i)}
                    </TableCell>
                    <TableCell data-label="Thickness (mm)">
                      {i.thickness}
                    </TableCell>
                    <TableCell data-label="Latest delivery">
                      {deliveryDate(i.latestDeliveryDate)}
                    </TableCell>
                    <TableCell
                      data-label="Notes"
                      className="text-muted-foreground"
                    >
                      {i.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right max-md:before:hidden">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(i)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleting(i)}
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
        open={formOpen}
        onOpenChange={setFormOpen}
        inquiry={editing}
        onSaved={() => {
          setFormOpen(false);
          loadInquiries();
        }}
      />

      <DeleteInquiryDialog
        inquiry={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          loadInquiries();
        }}
      />
    </main>
  );
}
