import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "CONFIRMED",
  "COMPLETED",
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const doctors = pgTable("doctors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").notNull(),
  speciality: text("speciality").notNull(),
  bio: text("bio"),
  imageUrl: text("image_url").notNull(),
  gender: genderEnum("gender").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const appointments = pgTable("appointments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  date: timestamp("date").notNull(),
  time: text("time").notNull(), // store time as string i.e. 14:30
  duration: integer("duration").default(30).notNull(), // duration in minutes
  status: appointmentStatusEnum("status").default("CONFIRMED").notNull(),
  notes: text("notes"),
  reason: text("reason"), // reason for appointment
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => doctors.id, { onDelete: "cascade" }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
