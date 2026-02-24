fetch("http://localhost:5000/api/subscriptions/renew/verify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    token: ""
  })
})
.then(res => res.json())
.then(data => console.log(data));