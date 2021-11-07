import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
import kp from './keypair.json'
import idl from './idl.json';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

declare global {
  interface Window {
    solana: any
  }
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
	'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
	'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
	'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
	'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([] as any);
  const [gifToVote, setGifToVote] = useState("")


  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } 
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return(
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item: {gifLink: string | undefined, upvotes: number, downvotes: number, userAddress: { toBase58: () => boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; }}, index: any) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
                <div style={{color:"black", backgroundColor: "grey", borderRadius: 8, margin: "10px"}}>
                  <div style={{width:"100%"}}>
                    <button 
                      style={{border: "1px solid green", width:"50%", borderRadius: 5, cursor:"pointer"}}
                      onClick={() => {
                          setGifToVote(item.gifLink!);
                          upvoteGif();
                      }}
                      >
                      {`✅ (${item.upvotes})`}
                    </button>
                    <button style={{border: "1px solid green", width:"50%", borderRadius: 5, cursor:"pointer"}}
                      onClick={() => {
                          setGifToVote(item.gifLink!);
                          downvoteGif();
                      }}>
                      {`❌ (${item.downvotes})`}
                    </button>
                  </div>
                  {item.userAddress.toString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );
  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event: any) => {
    const { value } = event.target;
    setInputValue(value);
  };
  const getProvider = () => {
    //@ts-ignore
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      //@ts-ignore
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const upvoteGif = async () => {
    console.log("upvoting GIF", gifToVote)
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);

      await program.rpc.upvoteItem (gifToVote, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully upvoted", gifToVote)
  
      await getGifList();
    } catch (error) {
      console.log("Error upvoting GIF:", error)
    }
  };

  const downvoteGif = async () => {
    console.log("upvoting GIF", gifToVote)
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);

      await program.rpc.downvoteItem (gifToVote, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully upvoted", gifToVote)
  
      await getGifList();
    } catch (error) {
      console.log("Error upvoting GIF:", error)
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(
          inputValue, 
          new PublicKey(walletAddress? walletAddress: ""), {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const getGifList = async() => {
    try {
      const provider = getProvider();
      //@ts-ignore
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
  <div className="App">
    <div className="container">
      <div className="header-container">
        <p className="header">🖼 GIF Portal</p>
        <p className="sub-text">
          View your GIF collection in the metaverse ✨
        </p>
        {!walletAddress && renderNotConnectedContainer()}
        {/* We just need to add the inverse here! */}
        {walletAddress && renderConnectedContainer()}
      </div>
      <div className="footer-container">
        <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
        <a
          className="footer-text"
          href={TWITTER_LINK}
          target="_blank"
          rel="noreferrer"
        >{`built on @${TWITTER_HANDLE}`}</a>
      </div>
    </div>
  </div>
);
};

export default App;