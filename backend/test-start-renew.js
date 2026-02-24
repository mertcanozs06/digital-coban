const test = async () => {
  try {
    // Önce giriş yapıp token al
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "ceyhun@gmail.com",  // Kayıtlı kullanıcı emaili
        password: "c123"         // Kayıtlı kullanıcı şifresi
      })
    });

    const loginData = await loginRes.json();
    console.log("LOGIN RESPONSE:", loginData);

    if (!loginData.token) {
      console.error("Giriş başarısız veya token yok");
      return;
    }

    const token = loginData.token;

    // Şimdi renew endpoint'ini çağır
    const res = await fetch("http://localhost:5000/api/subscriptions/renew", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("START RESPONSE:", data);
  } catch (err) {
    console.error(err);
  }
};

test();
