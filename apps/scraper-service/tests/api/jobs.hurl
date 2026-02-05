# Create a scrape job with all properties
POST http://localhost:3001/api/jobs
Content-Type: application/json
{
    "type": "category",
    "query": "https://www.myntra.com/men-casual-shirts",
    "maxPages": 2,
    "startPage": 1,
    "scraperMode": "API"
}
HTTP 200
[Captures]
job_id: jsonpath "$.jobId"
[Asserts]
jsonpath "$.jobId" != null
jsonpath "$.message" == "Job created successfully"

# List jobs
GET http://localhost:3001/api/jobs
HTTP 200
[Asserts]
jsonpath "$.jobs" isCollection
jsonpath "$.jobs[0]._id" != null

# Get the specific job we created and verify all properties
GET http://localhost:3001/api/jobs/{{job_id}}
HTTP 200
[Asserts]
jsonpath "$.job._id" == "{{job_id}}"
jsonpath "$.job.type" == "category"
jsonpath "$.job.query" == "https://www.myntra.com/men-casual-shirts"
jsonpath "$.job.maxPages" == 2
jsonpath "$.job.startPage" == 1
jsonpath "$.job.scraperMode" == "API"
jsonpath "$.job.status" == "pending"
