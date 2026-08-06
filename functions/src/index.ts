import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

// Starter endpoint for the next PayMongo step.
// For now, this only proves Firebase Functions builds and deploys correctly.
export const createPaymongoCheckout = onRequest((request, response) => {
  logger.info("createPaymongoCheckout called", {
    method: request.method,
    structuredData: true,
  });

  response.status(501).json({
    ok: false,
    message: "PayMongo checkout is not connected yet.",
  });
});
