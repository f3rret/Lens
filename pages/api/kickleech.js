
export default async function handler(req, res) {
  
    if (!req.query.sessionid) {
      return res.json({ data: 'session id not found' });
    }

    const result=await fetch(`http://localhost:9997/v1/rtspsessions/kick/${req.query.sessionid}`, {method: 'POST', body: JSON.stringify({id: req.query.sessionid})})
        .then(result=>result.text())
        .catch(error=>{return {error: error}});

    return res.status(200).json({result});
}  