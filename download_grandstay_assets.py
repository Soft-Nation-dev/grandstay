import argparse
from pathlib import Path
from urllib.request import Request, urlopen

ASSETS = {
    "grandstay-logo": "https://lh3.googleusercontent.com/aida/ALJJyrDI6KL_Tjty708Ha2hJ6KHG3LbGf_gkmdooPyYYze27F7vTwwcgcW_PhKfaBo2r-u3TZbsgBWqLrq6BrlkBV9IFM6eJ8PVGReiQZb3LlCktXhXPA487QoMceCBTkoVYTQ5YuvOYLDQnGUDZiOZejPrXojUruxVARoNqb1GYcjukJZbvIEGYjqnuuvPmDBIcX09D2t6f1r3cO9vSvMBsI_viUoro1Ok0ogvHWq_BNwBG",
    "guest-avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuA0parJVFzQOKpp-VmahCLUXD7nhyYZxqCWO_jhGscgpOtan3G0oyO-o66_ihdOUwpn7gwuf2-hviv7bSCN-Fd_WfAO8_L1NbfPlxzWsYFk7JT5BRKy-2t7rreJ8p0hizYuVJiwyP9AUNfRP81yo2o7syic9rJ8-oZFSSJ6doI4tX0dFLXkpUXj8aTTmV1kuPRxOInSFYafqnM92jr9EKOHPxcffrvrYIqyOsVP-dw",
    "deluxe-executive-suite": "https://lh3.googleusercontent.com/aida-public/AB6AXuCgnSJZqHBa2jD2_salNQE0DFdqiDmmVb58_cD12gZNi4lY-JCo2yrVxHVvpS6JBTfs0LFPINfo2JwSYKrzKrk5U7eKf6u4cbMFCDBkh6FH_uPdTrKL8tbJ6EPQ5hhqTzptPe5pKRZRYS7QGVsMsWmcUCClKetxLOHhXVFKULUXp05InhjLRONHNUBLUBMTWUNLNPs3wxP9yxfDZnCBNr4oChSeEIrhP3ePlFCHACU",
    "standard-cozy-haven": "https://lh3.googleusercontent.com/aida-public/AB6AXuCa4oeTBvK0d1bO7pVzxV_SS38yZ06kOttPk3I-4jQWB0znShDpeAqpWksA9yGnm6oQCKkKt6R0R0GoSTAwYtwNXFWQKPi3l2Djy6CY8Y2wZmYQdo75_OoqxGq4Rt-aPNKgeTN7oOnVOY2EzU6w0q-oLFnVoKleW14R-6WcVp1-aqG6Bl-n9u9_ZV8TXt7F2_ChkoK0-WJ7Ah2_HZ6OYvvr5I7LTj5vp68kPKZyjI0",
    "garden-view-room": "https://lh3.googleusercontent.com/aida-public/AB6AXuCcGfnDzv5Yr06ZTL_uv-WFMeo1b4qdeq5I6uWNYtKgTAMD4iU5tCsq-X8DqTNhhv7VpvrwOy__HNXj2RdzZrgWRKSDw-AwHqy2dyofy2_reUnI306RrqHk9vONsPCaAtASSAyZVUmgjGZ-5aLkwmMRbAa3Ojqk-e4eQ73t5bv81TFplmVB2VEZ-LTkHQRz8BYrGj64ffuuV_vhthlDGtM9yz9imQUThSYlud8NzF8",
    "ocean-panorama-suite": "https://lh3.googleusercontent.com/aida-public/AB6AXuC4wjRRcfBkodfWkxMHwPXQaOa_S8iLpboNZHem-xlkEz_CIWdd9iP-LrsSsVT_QtnIFY0SoIUECpq6Y1QG8xebKgQ4hZtmrFxhZCR5DJRhHvGqbNTtb5pLA4t2SVz-SvV4D6LO_KkbLUSl_-K_Dh8lvDUuBlThmHVW0h9jvT82gqir0itN8q7SxS2RDcZK9mcXUglFrRQac645mzL3dhKvRFqgdHdYKgk0mwQNyd0",
    "city-view-room": "https://lh3.googleusercontent.com/aida-public/AB6AXuBSCVnXN0UPzJ3NIJWRla7oz2pn6dvdyJ-daTVWhNCrGcBxtMnqzt8oA3k-N27umldQG9gIQB9TUkNnRfE1orY_0Hyo2BPzSJtz_YCO2q8_SkQuByE7HED9yvPKQZwvaxPtvow1F88d1se5LgC3Ie7pKMVWX2PwDZrQnOMaFug-93csjs62vmmQnwqdfEeuCYJQBx76Slku-T-MtQdEdzHehjngh4XuVG-ZGO0B_Lg",
    "dessert-platter": "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_9lqK4wpp2H7vjlP0MZGaKXyuStt_gJUmpKlj8GQsaTcS-5PuhcVVj-vBfYsZbbePQAaaFi-Dc3i-4PKqmpIu1DhYBi79Xe2bOluczZ0dr85DXgAivFy7wwRT8r9bv08tFLfHsvZ2bob-jaM5nAv06B17GyUtZe2xT5dtjhh5vgzMfsYV1zW3Pawc5Dk6VJThWJG47liNUSdourw_8fMbbrvp4ba13x_W87NPBE",
    "executive-suite": "https://lh3.googleusercontent.com/aida-public/AB6AXuDW7CPKGpsc2RqlW8U1BI6KFFCZng8Gw8RdQTfZgLNgutg6W9IMufwiwR9oq5BGWmkTcjRDT4-05z6S2LEK7Z1szuqhS2_jS95NeuhgmZGma7jYdUbcB9LjLF3sk-QWdSn7vONyo9Q5fvgOrJdniS8i73pbbkfweBUnbIzSOg2GTdGeLslH1LgevcLipaOjEK7vS8pdnaDMGFMwV67ioHprD2zJ2PtT-wY_gl9c08s",
    "concierge-desk": "https://lh3.googleusercontent.com/aida-public/AB6AXuCzMOe1acVrJmP75dw2Lg5MPjmcXkKiRia9-X9GuqpbifD-07yURgkjhB2nfTdxVUUe-Pq5pRipHpldqBezeb8HKn9c1iUNsB9s8LLu4gy-ZB88tjUpCD_jdCTb-GS4xlUx7vxuse7B5lFlBco77agVtArMiA9K0sHBth3pwarsVDfTURvnA6mzejRp30YX_k7QnyKcNHavb6Rq00726BuC2Mq-aRY0hc8fFhijxeo",
    "bath-towels": "https://lh3.googleusercontent.com/aida-public/AB6AXuDBka2RYQNsXO28cuVbIXCXrRYLC4aGeHcOIGqDYUsho7h1apsw4qCgOK2ERcsjHaa3F7VNikgXp2oLZMTozan3uwP6eRRIcYb6XGG6yQW4lIJ_SJIZar9WUVt4kP-CWNc2_GujHXGsH9kRNv5qsRlMzZrAt7ot_UfUiHCDb9frnbvms5N6SUBk66X94cv0KOvB3rR7dj4VcFzAImLGD-ocFFvvuhhutB9omh4xlkQ",
    "aloe-bath-gel": "https://lh3.googleusercontent.com/aida-public/AB6AXuCoPDfpwVRf96tCFq4-2usJxM3N_tYFOBmRVZ9u595Oha3dkZMyXDS6IILrpqHdtXpgXhI-2yqXvpv_UkfYG8B9ENI7Bn3_0Z_hob8JVe8O51j84gMppdgINKjBEFaCKgtSey596UHdhemPVwGLhUS5v7C1r-VEGJ0u_T2peTGsS0o_i3AorfMgyEQvM5cLLIjksmMS2PlsOL1XUz3iFRl0XZWmmSZa8RpRiT2q8lo",
    "staff-amina": "https://lh3.googleusercontent.com/aida-public/AB6AXuDQAew_amWmyhs9UKF8d0hXO-z-3wRKVK_9aAqiEjsjZvV_JS2kgvtz_WH08mYzr6e1JUkDW0jon6sqF2MedEwY41F8RAdgJXTWeSeV52F5RAL_fJTGaEis3y7oD3u0kfpFQMNeSQN37wtIfVGBFXRWv3iiNyDKe1jSF0YhqRDMEp7u9KXZAseQGW739tZb2THukgIdigiLooIkHTgrPAKpY84AQNSmFHowDARaXPI",
    "concierge-tunde": "https://lh3.googleusercontent.com/aida-public/AB6AXuBL88vebbQEajyD8KJMENPnDy7kPDgL6XHdMIFKIqB9j47twSYK4dnd3d_SDTet6JGEfxfwnshsJ_tempahspwSvErc8uj1Hu-nVLhM2IPvSpdWWyCtJdQDQ1IvQpeFcjSCbkCIzTqoReazpny3Anc-nkn-c8pDHCw_ancXaeoTBEvGiqhReVQ3WZTvikL4VEy8zkt-QX13CPkS2XWFYTKMP2EW1-tr9KseescFZdc",
    "concierge-avatar-1": "https://lh3.googleusercontent.com/aida-public/AB6AXuDoRMwPNfZ5RLXbHfHwfm1YJceEXmG_GY8MtrO31iQUYT-Q27D6_kN4bmGwrqWWbu5GBRs_Y6qMvy30aZKGq44aeppBDnByxZBQ8yLt_kL1gXNCG9NTXL8wC6zHGgB9JGK138Q7I4ObfgcLq7cqPkX0_FmumZRpnPaKMmFsXtJa13-BfjA0wlGdFXT_Zeu9fKBOeonEZDh4MsvXLFTP5iPz17jnMyKkwRaBnKO9W5k",
    "concierge-avatar-2": "https://lh3.googleusercontent.com/aida-public/AB6AXuBbkeY359itbcEyXTpGREcmABkYxg488AXfxJC4e_-upfqWwDV7f1fHF5z2SVbacw3dC79AkewgfGtXi3kFe45HxAGHrZKaQnmntiHZsdqJ2azV1Qad0FHJecc1HlzFGgZ4M71SuwQXUHxD_d7RpSGU4H_ZAln_yz94Ay2DLR89xO6nL44FhLPa8fgzTqGYjln-8ElE4gWaGBPGqQeBwpTEYd4HQTmt5qPIW7HpNCk",
    "restaurant": "https://lh3.googleusercontent.com/aida-public/AB6AXuAiAzG8c7PG60k8nfsjTvLZMCd_i39Tyf5F1ZoBI6kFtR_Vata-3UtMV5LqgdxgVdhPZSGmptYGYMxN_3CxX7wicTPSZmIdM0W1mA05Ouv_5vOXnlnocq7Pxx0ABVH2wLER0I25kkj8Vs-1rTKRa0Edd47lIjtI7gkWmreZenlhj8w9ZgDKZJrcPz0Zjxx0ilevb70v3Rh9Uqxsst0Os5sqoNQyqCTw89xiBFgIFKE",
    "concierge-avatar-3": "https://lh3.googleusercontent.com/aida-public/AB6AXuAohdWL7u-6rkhMJYt9K_yZLkfKtVwhAj9kaCSv1T5Ku6rDHcM-DPCr1OB1Gz3HaCoVTtLxShx9k7xc3XU1u9BsjAPMH4-CiktIG490F8Hg0IkTJ0onkvF0g63Xr3yGp_A7odZvvit3XPIxDCvemcVF9AOFOy-JEtBI2v14UTrT806d0VYP8pmhmVf5egMSPfVzqdEHum-LN7Rn_hZ6P7pgZB75mGn8B2f6xlYf8kQ",
    "executive-lounge": "https://lh3.googleusercontent.com/aida-public/AB6AXuD1h--deikJiRustfTTD1Eb9qzEGRPkQNuM0POWKaXLdMYXW05vl-aaK4KDivMYUAIeUXsVtaPA2FjjfUib6XtHOj4erOX5xv8pHODQV2hUGxo2pHgAOmvmQCBLD9OBLYcVxZqoko42G6i0zfZOhaSUQadKb5_iiCvMvEfPaWE33ytJIgBYFnDkD4y2ufW9nNjZe6M7BlRx-EWpV1Q_loFUYe2mMzDO5bw17TKslfs",
    "lagoon-terrace-pool": "https://lh3.googleusercontent.com/aida-public/AB6AXuDARWDIlkv8fzPMUNmDC4GFHJLOXd_fqanFehMA_sfm8EIy30kMlnlMIOvycUSTm3jpgAh39MMg1Jl7WN5oRDnVfqmpzo2BIzBB_RmZzHUiVVQnYSDEnXGtWjd2c_Tg1LUPjy6hAFIfDO5f26oVtN2IwFo-N9gXAAN4QaT5U_T8x1wNldljNtdDPc95ucZa-DpcpE3p_P9--Y8elLZe8GCqOjoPjEOL2uFe6POIsOM"
}


def image_extension(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return ".gif"
    if data[4:8] == b"ftyp" and data[8:12] in (b"avif", b"avis"):
        return ".avif"
    raise ValueError("Response is not a supported image")


def download_assets(destination):
    destination.mkdir(parents=True, exist_ok=True)
    downloaded = 0
    for name, url in ASSETS.items():
        try:
            request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(request, timeout=30) as response:
                data = response.read()
            path = destination / (name + image_extension(data))
            path.write_bytes(data)
            downloaded += 1
            print(f"Saved {path}")
        except Exception as error:
            print(f"Failed {name}: {error}")
    print(f"Downloaded {downloaded}/{len(ASSETS)} assets.")
    return int(downloaded != len(ASSETS))


def main():
    parser = argparse.ArgumentParser(description="Download GrandStay design assets")
    parser.add_argument("--output", type=Path, default=Path("public/images"))
    args = parser.parse_args()
    return download_assets(args.output)


if __name__ == "__main__":
    raise SystemExit(main())
