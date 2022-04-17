export default async function handler(req, res) {
    const metrics=await fetch(`http://localhost:9998/metrics`)
        .then(result=>result.text())
        .catch(error=>{return {error: error}});
    
    res.status(200).json(parseMetrics(metrics));
}

function parseMetrics(raw){
    if(!raw || raw.error) return raw;
    let parsed={};
  
    raw.split('\n')
      .filter((v)=>v.indexOf('rtsp_sessions')>-1)
      .forEach((r)=>{
        if(r.indexOf('idle')>-1)
          parsed.idle=parseInt(r.replaceAll(/[^\d]/igm, ''));
        else if(r.indexOf('read')>-1)
          parsed.read=parseInt(r.replaceAll(/[^\d]/igm, ''));
        else if(r.indexOf('publish')>-1)
          parsed.publish=parseInt(r.replaceAll(/[^\d]/igm, ''));
        else
          console.log('unknown statistic:', r);
      });
  
    return parsed;
  }