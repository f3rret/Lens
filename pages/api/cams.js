

export default async function handler(req, res) {
    const cams=await fetch(`http://localhost:9997/v1/paths/list`)
        .then(result=>result.json())
        .catch(error=>{return {error: error}});

    const sessions=await fetch(`http://localhost:9997/v1/rtspsessions/list`)
        .then(result=>result.json())
        .catch(error=>{return {error: error}});

    res.status(200).json({...cams, sessions});
}
  