"use client";

import { useRef } from "react";

export default function RequestModal({ createRequestAction }: { createRequestAction: (formData: FormData) => Promise<void> }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <section>
      <button onClick={() => modalRef.current?.showModal()}>+ New Request</button>
      
      <dialog ref={modalRef} style={{ padding: "20px" }}>
        <h2>New Metal Request</h2>
        <form 
          action={async (formData) => {
            await createRequestAction(formData);
            modalRef.current?.close();
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <label>Type: </label>
            <input name="type" required />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Quantity: </label>
            <input name="quantity" type="number" required />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Budget: </label>
            <input name="budget" type="number" step="0.01" required />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Description: </label>
            <textarea name="description" required />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit">Submit</button>
            <button type="button" onClick={() => modalRef.current?.close()}>Cancel</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
