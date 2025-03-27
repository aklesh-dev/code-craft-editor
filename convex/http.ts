import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",

  handler: httpAction( async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if(!webhookSecret){
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    const svix_id = request.headers.get("svix-id"); //* used to uniquely identify the webhook event
    const svix_signature = request.headers.get("svix-signature"); //* verify the authenticity of the webhook request, ensuring that it came from the expected source.
    const svix_timestamp = request.headers.get("svix-timestamp"); //* verify the timeliness of the webhook request, ensuring that it was not received too late or too early.

    if(!svix_id ||!svix_signature ||!svix_timestamp){
      return new Response("Error Occured: Missing svix headers", { status: 400 });
    }

    const payload = await request.json(); //* parse the request body as JSON
    const body = JSON.stringify(payload); //* convert the JSON payload to a string

    const wh = new Webhook(webhookSecret); //* create a new webhook object with the secret key
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as WebhookEvent; //* verify the webhook signature and timestamp, and parse the event data as a WebhookEvent object
    } catch (error) {
      console.error("Error verifying webhook: ", error);
      return new Response("Error Occured: Invalid svix headers", { status: 400 });
    }

    const eventType = evt.type; //* get the event type
    if(eventType === "user.created"){
      //? handle user creation event
      const {id, email_addresses, first_name, last_name } = evt.data; //* extract the user data from the event

      const email = email_addresses[0].email_address; //* get the user's email address
      const name = `${first_name || ""} ${last_name || ""}`.trim(); //* get the user's full name

      try {
        //* save the user data to the database
        await ctx.runMutation(api.users.syncUser, {
          userId: id,
          email,
          name,
        })
        
      } catch (error) {
        const errorMessage = (error as Error).message || "Unknown error";
        console.error(`Error processing user.created event: ${errorMessage}`);
        return new Response("Error create user", { status: 500 });
      }
      
    }
    return new Response("Webhook processed successfully", { status: 200 });
    
  }),
});

export default http;