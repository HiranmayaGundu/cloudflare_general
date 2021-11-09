import * as yup from "yup";

export const isValidationError = (err: any): err is yup.ValidationError => {
  return err && err.name && err.name === "ValidationError";
};

// temporarily allow my my requests to be served by any URL for testing against prod URL
// Todo: change to final URL=
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

export const createErrorResponse = (
  message: string,
  status: number,
  additionalInformation?: string
) => {
  return new Response(
    JSON.stringify({ message, additionalInformation }, null, 2),
    {
      status,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        ...corsHeaders,
      },
    }
  );
};

export const createSuccessResponse = (
  responseData: any,
  status = 200,
  headers: Record<string, string> = {}
) => {
  return new Response(JSON.stringify(responseData, null, 2), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      ...corsHeaders,
      ...headers,
    },
  });
};
