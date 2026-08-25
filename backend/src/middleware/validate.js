export const validate = (schema, source = 'body') => (request, response, next) => {
  const value = schema.parse(request[source]);
  request.validated = { ...(request.validated || {}), [source]: value };
  next();
};
