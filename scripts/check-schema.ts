async function checkSchema() {
  const url = 'https://cuunipngguedqttuutaa.supabase.co/rest/v1/'
  const key = 'sb_publishable_QndVljA4Ne4Zodc-zlYH9A_r688lNuF'

  try {
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    const json = await res.json()
    console.log('Available tables/definitions in Supabase schema:', Object.keys(json.definitions || {}))
  } catch (err) {
    console.error('Error fetching schema:', err)
  }
}

checkSchema()
