import { db } from "@/db/client";

export const getWeeklyDonationsQuery = db.query<
    { amount: number; recipient_id: string },
    { $donor_id: string; $since: string }
>(`
    SELECT amount, recipient_id
    FROM xp_donations
    WHERE donor_id = $donor_id AND timestamp >= $since
`);

export const insertDonationQuery = db.query<
    void,
    { $donor_id: string; $recipient_id: string; $amount: number }
>(`
    INSERT INTO xp_donations (donor_id, recipient_id, amount)
    VALUES ($donor_id, $recipient_id, $amount)
`);
