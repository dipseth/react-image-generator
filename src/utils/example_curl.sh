

curl -X POST http://10.0.0.77:7979/notify \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 20,
    "position": 0,
    "title": "Test Title",
    "titleColor": "#50BFF2",
    "titleSize": 10,
    "message": "Test message from curl",
    "messageColor": "#fbf5f5",
    "messageSize": 14,
    "backgroundColor": "#0f0e0e",
    "media": {
      "image": {
        "uri": "https://43ovme69bhg9qtezuc6enpsbvuc5glsx.ui.nabu.casa/media/local/local/local/snapshot.png?authSig=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkMmUyZGYzZmQ3ZWQ0NzMxYTdmZDRkNzg5OTlhMGM2YyIsInBhdGgiOiIvbWVkaWEvbG9jYWwvbG9jYWwvbG9jYWwvc25hcHNob3QucG5nIiwicGFyYW1zIjpbXSwiaWF0IjoxNzQ3NTg4NDE1LCJleHAiOjE3NDc2NzQ4MTV9.MIHmq3t1fd_ishjmzQbFcZGwM2fHj6FofalYx2j3c5o"
      }
    }
  }' \
  -v --insecure
