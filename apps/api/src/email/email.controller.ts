import Elysia, { t } from "elysia";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const app = new Elysia({ prefix: "email" });

app.post(
  "/send",
  async ({ body }) => {
    try {
      const { data, error } = await resend.emails.send({
        from: body.from,
        to: body.to,
        subject: body.subject,
        html: body.html,
        text: body.text,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
  {
    body: t.Object({
      from: t.String({
        description: "Sender email address (must be verified domain with Resend)",
        examples: ["onboarding@resend.dev"],
      }),
      to: t.Union([
        t.String({ description: "Recipient email address" }),
        t.Array(t.String(), { description: "Multiple recipient email addresses" }),
      ]),
      subject: t.String({ description: "Email subject" }),
      html: t.Optional(
        t.String({
          description: "HTML content of the email",
        }),
      ),
      text: t.Optional(
        t.String({
          description: "Plain text content of the email",
        }),
      ),
    }),
  },
);

export { app as emailController };
