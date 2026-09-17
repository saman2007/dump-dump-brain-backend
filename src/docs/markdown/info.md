You can find the documentation of all API endpoints here.

Reserved error codes(`errorCode`) are:

- `-1`: In case that the request body has validation errors, an error response with `errorCode = -1` will be sent and the `data` will be the explanation of the validation errors. See the [the model structure](/docs#models/ValidationErrorResponse).
