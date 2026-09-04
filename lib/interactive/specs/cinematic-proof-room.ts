import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const cinematicProofRoomSpecSchema =
  createScrollySpecSchema("cinematic-proof-room");

export type CinematicProofRoomSpec = z.infer<
  typeof cinematicProofRoomSpecSchema
>;
export type CinematicProofRoomStep = ScrollyStep;
