import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSpring, animated } from "react-spring";
import Link from 'next/link';
import useClickToCopy from "../hooks/useClickToCopy";
import { Fade } from "react-awesome-reveal";

let data: any = {};
fetch("https://api.coincap.io/v2/assets")
  .then(res => res.json())
  .then(all => {
    data = all;
  })

function Number({ n }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: n,
    delay: 200,
    config: { mass: 1, tension: 25, friction: 9 },
  });
  return <animated.div>{number.to((n) => cashFormat(n.toFixed(2)))}</animated.div>
}

function cashFormat(x: any) {
    return `$${parseFloat(x).toFixed(2).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g,",")}`;
}

export default function DynamicPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [cash, setCash] = useState<any>(0);
  const [cryptoAmount, setCryptoAmounts] = useState<any>("");
  const [cryptoSymbol, setCryptoSymbols] = useState<any>("");
  const [copyStatus, copy] = useClickToCopy(`https://coinworth.xyz/${slug}`);

  function loadInfo() {
    (fetch("/api/users"))
      .then(response => response.json())
      .then(data => {
        let account = data["data"].find((x: { username: string; }) => x.username === slug);
        try {
          isNaN(account.cash) ? setCash(0) : setCash(account.cash);
          account.cryptoAmounts != '' ? setCryptoAmounts(account.cryptoAmounts.split(",")) : setCryptoAmounts(0);
          account.cryptoSymbols != '' ? setCryptoSymbols(account.cryptoSymbols.toUpperCase().split(",")) : setCryptoSymbols(0);

        } catch {
          setCash([]);
          setCryptoAmounts("");
          setCryptoSymbols("");
        }
      })
      .catch(function() {
        console.log("error");
    });
  }

  useEffect(() => {loadInfo()});
 
  const [width, setWidth]   = useState(typeof window === 'undefined' ? 0 : window.innerWidth);
  const [height, setHeight] = useState(typeof window === 'undefined' ? 0 : window.innerHeight);
  const updateDimensions = () => {
      if (typeof window !== 'undefined') {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      }
  }

  useEffect(() => {
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
}, [updateDimensions]);
  

  const crypto = Array.from(cryptoAmount);
  const cryptoTotal = crypto.map((x: any, i: any) => {
    try {
      return x*parseFloat(data["data"].find((x: { [x: string]: any; }) => x["symbol"] === cryptoSymbol[i]).priceUsd)
    } catch {
      return 0;
    }
  })
  
  let total = parseFloat(cash) + cryptoTotal.reduce((x: any, y: any) => x + y, 0);

  return (
    <>
      <div>
        {!isNaN(total) ? (
        <>
          <title>{cashFormat(total)}</title>
          <Fade cascade damping={0.1} direction="up">
            <h1 className="total-value">{<Number n={total}></Number>}</h1><h2>Total Value</h2>
          </Fade>
        </>) : (
        <>
          <title>User not found</title>
          <Fade cascade damping={0.1} direction="up" delay={100}>
            <h1>User not found</h1>
          </Fade>
          <Fade delay={100}>
            <Link className="big-button-text big-button bottom-0 shrink" href={`/${slug}/create`}>Create user {slug}</Link>
          </Fade>
        </>
        )}
      </div>
      {cash > 0 ? <Fade cascade damping={0.1}><div className="holding">USD <span>{cashFormat(cash)}<span className="percent">&nbsp;&nbsp;{((cash/total)*100).toFixed(2)}%</span></span></div></Fade> : ""}
      {crypto != null ? crypto.map((x: any, i: any) => {
        let result: any;
        try {
          result = (crypto.length != undefined ? x*parseFloat(data["data"].find((x: { [x: string]: any; }) => x["symbol"] === cryptoSymbol[i]).priceUsd): "") || function(){throw "error"}();
        } catch {
          result = "";
        }
        return (
          <Fade cascade damping={0.1} delay={100}>
            <div className="holding" key={x}>
              {x != 0 ? x : ""} {cryptoSymbol[i] != 0 ? cryptoSymbol[i] : ""}
              <span>
              {result != 0 ? cashFormat(result) : ""} {!isNaN(result/total) ? <span className="percent">&nbsp;&nbsp;{((result/total)*100).toFixed(2)}%</span> : ""}
              </span>
            </div>
          </Fade>
        )
      }) : ""}
      {!isNaN(total) ? (<Fade cascade damping={0.1} duration={200}><button style={{ bottom: (crypto.length >= 4 || width > 500) ? "unset" : "0" }} className="big-button-text button-text shrink copy-button" onClick={copy}>{!copyStatus ? <>{"Copy Link"}</> : <>{"Copied!"}</>}</button></Fade>) : ""}
    </>
  )  
};