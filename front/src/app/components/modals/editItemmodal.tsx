'use client'

import { useState } from 'react';
import Modal from './modal';
import { useForm } from "react-hook-form";
import { AlimentosItf } from '@/src/app/utils/types/AlimentosItf';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import Cookies from 'js-cookie';
type inputs = {
  nome?: string;
  peso?: number;
};

export default function EditItemModal({ id, dispensaId }: { id: number, dispensaId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit } = useForm<AlimentosItf>();
  const router = useRouter();

  async function tryinput(data: inputs) {
    console.log("Dados recebidos:", data);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/dispensa/${dispensaId}/alimentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" ,
           Authorization: "Bearer " + Cookies.get("token") || ""
        },
        body: JSON.stringify({
          nome: data.nome,
          peso: Number(data.peso),
          
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("Erro ao enviar:", errorData);
        } else {
          const errorText = await response.text();
          console.error("Erro ao enviar (texto):", errorText);
        }
      } else {
        console.log("Item enviado com sucesso!");
        setIsOpen(false);
        window.location.reload();
        toast.success("Item enviado com sucesso!");
      }
    } catch (error) {
      console.error("Erro de rede ou outra falha:", error);
    }
  }

  return (
    <>
      <button
        className="px-4 py-2 bg-[#2c2c2c] text-[#ffffff] rounded-md hover:bg-[#1e1e1e] font-medium"
        onClick={() => setIsOpen(true)}
      >
        Editar
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit(tryinput)}>
          <label className="block text-sm font-medium text-foreground">
            Nome do alimento
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-input bg-background text-foreground shadow-sm"
            type="text"
            required
            {...register("nome")}
          />
          <label className="block text-sm font-medium text-foreground mt-4">
            Qtd\Kg
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-input bg-background text-foreground shadow-sm"
            type="number"
            required
            {...register("peso", { valueAsNumber: true })}
          />
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Salvar
          </button>
        </form>
      </Modal>
    </>
  );
}
