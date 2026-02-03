# Health Check
GET http://localhost:3001/api/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.timestamp" isInteger
