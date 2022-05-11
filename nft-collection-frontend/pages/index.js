import { useEffect, useRef, useState } from 'react';
import Head from "next/head";
import {providers, Contract, utils} from "ethers";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css"
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../constants';

export default function Home() {

  const web3ModalRef = useRef();
  const [presaleStarted, setPresaleStarted] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [loading, setLoading] = useState(false);
  const [numTokenMinted, setNumTokensMinted] = useState("")
  const [isOwner, setIsOwner] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch(err) {
      console.error(err);
    }
    
  }

  const getProviderOrSigner = async(needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);    
    const {chainId} = await web3Provider.getNetwork();
    
    if(chainId != 4) {
      window.alert("please switch to the Rinkeby network");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  const getOwner = async() => {
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const owner = await nftContract.owner();

      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    }catch(err) {
      console.error(err);
    }
  }

  const startPresale= async() => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    }catch(err) {
      console.error(err);
    }
    setLoading(false);
  }

  const checkIfPresaleStarted= async() => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract( NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const isPresaleStarted = await nftContract.presaleStarted();
      if(!isPresaleStarted) {
        await getOwner();
      }
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch(err) {
      console.error(err);
    }
  }

  const presaleMint = async() => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      });
      await txn.wait();

      window.alert("successfully minted a crypto dev");
    }catch(err) {
      console.error(err);
    }
    setLoading(false);
  }

  const publicMint = async() => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01")
      });
      await txn.wait();

      window.alert("successfully minted a crypto dev");
    }catch(err) {
      console.error(err);
    }
    setLoading(false);
  }

  const checkIfPresaleEnded = async() => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI,
        provider
      );

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      
      const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));
      setPresaleEnded(hasPresaleEnded);
    }catch(err) {
      console.error(err);
    }
  }

  const getNumMintedTokens = async() => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI,
        provider
      );

      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());
    }catch(err) {
      console.error(err);
    }
  }

  const onPageLoad = async() => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();

    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    setInterval(async() => {
      await getNumMintedTokens();
    }, 5 * 1000);

    setInterval(async() => {
      const presaleStarted = await checkIfPresaleStarted();
      
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000);
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  }, [])

  function renderButton() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      )
    }

    if (loading) {
      return <span className={styles.description}> Loading...</span>
    }
    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button} >
          Start Presale
        </button>
      )
    }

    if (!presaleStarted) {
      return(
        <div>
          <span className={styles.description}>
            Presale not started yet, come back later!
          </span>
        </div>
      )
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <span className={styles.description}>Presale has started, if your address is whitelisted, you can mint a crypto dev.</span>
          <button onClick={presaleMint} className={styles.button}>
            Presale mint
          </button>
        </div>
      )
    }

    if (presaleEnded) {
      return(
        <div>
          <span className={styles.description}>
            Presale has ended.
            You can mint crypto dev in public sale, if any remain.
          </span>
          <button onClick={publicMint} className={styles.button}>
            Public mint
          </button>
        </div>
      )
    }
  }

  return (
    <div>
       <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numTokenMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}
