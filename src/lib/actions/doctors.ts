"use server";

import { db } from "../drizzle";
import { doctors, genderEnum, appointments } from "../schema";
import { eq, count, desc, asc, sql } from "drizzle-orm";
import { generateAvatar } from "../utils";
import { revalidatePath } from "next/cache";

export async function getDoctors() {
  try {
    const result = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        email: doctors.email,
        phone: doctors.phone,
        speciality: doctors.speciality,
        bio: doctors.bio,
        imageUrl: doctors.imageUrl,
        gender: doctors.gender,
        isActive: doctors.isActive,
        createdAt: doctors.createdAt,
        updatedAt: doctors.updatedAt,
        appointmentCount: sql<number>`count(${appointments.id})`,
      })
      .from(doctors)
      .leftJoin(appointments, eq(doctors.id, appointments.doctorId))
      .groupBy(doctors.id)
      .orderBy(desc(doctors.createdAt));

    return result;
  } catch (error) {
    console.log("Error fetching doctors:", error);
    throw new Error("Failed to fetch doctors");
  }
}

interface CreateDoctorInput {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  gender: "MALE" | "FEMALE";
  isActive: boolean;
}

export async function createDoctor(input: CreateDoctorInput) {
  try {
    if (!input.name || !input.email)
      throw new Error("Name and email are required");

    const [doctor] = await db
      .insert(doctors)
      .values({
        ...input,
        imageUrl: generateAvatar(input.name, input.gender),
      })
      .returning();

    revalidatePath("/admin");

    return doctor;
  } catch (error: any) {
    console.error("Error creating doctor:", error);

    // handle unique constraint violation
    if (error?.code === "23505") {
      // PostgreSQL unique violation
      throw new Error("A doctor with this email already exists");
    }

    throw new Error("Failed to create doctor");
  }
}

interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  id: string;
}

export async function updateDoctor(input: UpdateDoctorInput) {
  try {
    // validate
    if (!input.name || !input.email)
      throw new Error("Name and email are required");

    const [currentDoctor] = await db
      .select({ email: doctors.email })
      .from(doctors)
      .where(eq(doctors.id, input.id))
      .limit(1);

    if (!currentDoctor) throw new Error("Doctor not found");

    // if email is changing, check if the new email already exists
    if (input.email !== currentDoctor.email) {
      const [existingDoctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.email, input.email))
        .limit(1);

      if (existingDoctor) {
        throw new Error("A doctor with this email already exists");
      }
    }

    const [doctor] = await db
      .update(doctors)
      .set({
        name: input.name,
        email: input.email,
        phone: input.phone,
        speciality: input.speciality,
        gender: input.gender,
        isActive: input.isActive,
      })
      .where(eq(doctors.id, input.id))
      .returning();

    return doctor;
  } catch (error) {
    console.error("Error updating doctor:", error);
    throw new Error("Failed to update doctor");
  }
}

export async function getAvailableDoctors() {
  try {
    const result = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        email: doctors.email,
        phone: doctors.phone,
        speciality: doctors.speciality,
        bio: doctors.bio,
        imageUrl: doctors.imageUrl,
        gender: doctors.gender,
        isActive: doctors.isActive,
        createdAt: doctors.createdAt,
        updatedAt: doctors.updatedAt,
        appointmentCount: sql<number>`count(${appointments.id})`,
      })
      .from(doctors)
      .leftJoin(appointments, eq(doctors.id, appointments.doctorId))
      .where(eq(doctors.isActive, true))
      .groupBy(doctors.id)
      .orderBy(asc(doctors.name));

    return result;
  } catch (error) {
    console.log("Error fetching available doctors:", error);
    throw new Error("Failed to fetch available doctors");
  }
}
