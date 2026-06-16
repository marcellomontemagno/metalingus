"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
import InquiryFormDialog from "./InquiryFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import createCode from "@/lib/utils/createCode";
import { formatDimensions, formatDeliveryDate } from "@/lib/utils/format";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredInquiries = inquiries.filter((inquiry) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      createCode(inquiry),
      inquiry.barsRequested,
      inquiry.grade,
      inquiry.shape,
      formatDimensions(inquiry),
      inquiry.thickness,
      formatDeliveryDate(inquiry.latestDeliveryDate),
      inquiry.notes ?? "",
    ].some((field) => String(field).toLowerCase().includes(query));
  });

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
            <div className="space-y-4">
              <div className="flex max-w-sm items-center">
                <InputGroup>
                  <InputGroupAddon>
                    <Search className="size-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Filter inquiries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              {filteredInquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No matching inquiries found.
                </p>
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
                    {filteredInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell data-label="Code">{createCode(inquiry)}</TableCell>
                        <TableCell data-label="Bars">{inquiry.barsRequested}</TableCell>
                        <TableCell data-label="Grade">{inquiry.grade}</TableCell>
                        <TableCell data-label="Shape">{inquiry.shape}</TableCell>
                        <TableCell data-label="Dimensions (mm)">
                          {formatDimensions(inquiry)}
                        </TableCell>
                        <TableCell data-label="Thickness (mm)">
                          {inquiry.thickness}
                        </TableCell>
                        <TableCell data-label="Latest delivery">
                          {formatDeliveryDate(inquiry.latestDeliveryDate)}
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
            </div>
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
