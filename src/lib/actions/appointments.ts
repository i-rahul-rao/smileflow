"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../drizzle";
import { appointments, users, doctors } from "../schema";
import { eq, desc, and, gte, lte, or } from "drizzle-orm";

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName:
      `${appointment.user?.firstName || ""} ${appointment.user?.lastName || ""}`.trim(),
    patientEmail: appointment.user?.email,
    doctorName: appointment.doctor?.name,
    doctorImageUrl: appointment.doctor?.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

export async function getAppointments() {
  try {
    const result = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        time: appointments.time,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        userId: appointments.userId,
        doctorId: appointments.doctorId,
        user_firstName: users.firstName,
        user_lastName: users.lastName,
        user_email: users.email,
        doctor_name: doctors.name,
        doctor_imageUrl: doctors.imageUrl,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .orderBy(desc(appointments.createdAt));

    return result
      .map((row) => ({
        ...row,
        user: {
          firstName: row.user_firstName,
          lastName: row.user_lastName,
          email: row.user_email,
        },
        doctor: {
          name: row.doctor_name,
          imageUrl: row.doctor_imageUrl,
        },
      }))
      .map(transformAppointment);
  } catch (error) {
    console.log("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

export async function getUserAppointments() {
  try {
    // get authenticated user from Clerk
    const { userId } = await auth();
    if (!userId) throw new Error("You must be logged in to view appointments");

    // find user by clerkId from authenticated session
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user)
      throw new Error(
        "User not found. Please ensure your account is properly set up.",
      );

    const result = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        time: appointments.time,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        userId: appointments.userId,
        doctorId: appointments.doctorId,
        user_firstName: users.firstName,
        user_lastName: users.lastName,
        user_email: users.email,
        doctor_name: doctors.name,
        doctor_imageUrl: doctors.imageUrl,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.userId, user.id))
      .orderBy(appointments.date, appointments.time);

    return result
      .map((row) => ({
        ...row,
        user: {
          firstName: row.user_firstName,
          lastName: row.user_lastName,
          email: row.user_email,
        },
        doctor: {
          name: row.doctor_name,
          imageUrl: row.doctor_imageUrl,
        },
      }))
      .map(transformAppointment);
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw new Error("Failed to fetch user appointments");
  }
}

export async function getUserAppointmentStats() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("You must be authenticated");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) throw new Error("User not found");

    // these calls will run in parallel, instead of waiting each other
    const [totalCount, completedCount] = await Promise.all([
      db.$count(appointments, eq(appointments.userId, user.id)),
      db.$count(
        appointments,
        and(
          eq(appointments.userId, user.id),
          eq(appointments.status, "COMPLETED"),
        ),
      ),
    ]);

    return {
      totalAppointments: totalCount,
      completedAppointments: completedCount,
    };
  } catch (error) {
    console.error("Error fetching user appointment stats:", error);
    return { totalAppointments: 0, completedAppointments: 0 };
  }
}

export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const result = await db
      .select({ time: appointments.time })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.date, new Date(date)),
          or(
            eq(appointments.status, "CONFIRMED"),
            eq(appointments.status, "COMPLETED"),
          ),
        ),
      );

    return result.map((appointment) => appointment.time);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return []; // return empty array if there's an error
  }
}

interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  try {
    const { userId } = await auth();
    if (!userId)
      throw new Error("You must be logged in to book an appointment");

    if (!input.doctorId || !input.date || !input.time) {
      throw new Error("Doctor, date, and time are required");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user)
      throw new Error(
        "User not found. Please ensure your account is properly set up.",
      );

    const [appointment] = await db
      .insert(appointments)
      .values({
        userId: user.id,
        doctorId: input.doctorId,
        date: new Date(input.date),
        time: input.time,
        reason: input.reason || "General consultation",
        status: "CONFIRMED",
      })
      .returning();

    // Since we need to join, but insert doesn't support joins, we can do a separate query or just return the inserted data without relations for now.
    // For simplicity, return the appointment without the joined data, or do a select after insert.

    // Actually, to keep it simple, since the transform expects the joined data, let's do a select after insert.

    const result = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        time: appointments.time,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        userId: appointments.userId,
        doctorId: appointments.doctorId,
        user_firstName: users.firstName,
        user_lastName: users.lastName,
        user_email: users.email,
        doctor_name: doctors.name,
        doctor_imageUrl: doctors.imageUrl,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.id, appointment.id))
      .limit(1);

    const row = result[0];
    return transformAppointment({
      ...row,
      user: {
        firstName: row.user_firstName,
        lastName: row.user_lastName,
        email: row.user_email,
      },
      doctor: {
        name: row.doctor_name,
        imageUrl: row.doctor_imageUrl,
      },
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    throw new Error("Failed to book appointment. Please try again later.");
  }
}

export async function updateAppointmentStatus(input: {
  id: string;
  status: "CONFIRMED" | "COMPLETED";
}) {
  try {
    const [appointment] = await db
      .update(appointments)
      .set({ status: input.status })
      .where(eq(appointments.id, input.id))
      .returning();

    return appointment;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }
}
