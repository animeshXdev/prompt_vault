import React from "react";
import prisma from "@/lib/db";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { prompts: { where: { isDeleted: false } } },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <CategoriesClient categories={categories} />
    </div>
  );
}
