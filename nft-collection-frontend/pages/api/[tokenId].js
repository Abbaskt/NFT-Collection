// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const tokenId = req.query.tokenId;

  const name = `Crytpo Dev #${tokenId}`;
  const description = "Cryptodevs is an NFT collection for Web3 Developers";
  const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/ae651d5fd04ada78f97a2cb540cfd1c482ea542f/my-app/public/cryptodevs/${Number(tokenId) -1}.svg`;
  res.status(200).json({
    name: name,
    description: description,
    image: image
  })
}
