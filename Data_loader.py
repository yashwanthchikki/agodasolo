import pandas as pd
import streamlit as st

def load_data():
    try:
        return pd.read_excel("data.xlsx")
    except FileNotFoundError:
        st.error("Error: 'data.xlsx' not found.")
        st.stop()
    except Exception as e:
        st.error(f"Error loading data: {e}")
        st.stop()

def apply_sidebar_filters(df):
    st.sidebar.markdown("### Data Filters (Universal)")
    filtered_df = df.copy()

    if "CATEGORY" in df.columns:
        with st.sidebar.expander("Filter Categories", expanded=True):
            cats = df["CATEGORY"].dropna().unique().tolist()
            sel = [c for c in cats if st.checkbox(c, True, key=f"c_{c}")]
        filtered_df = filtered_df[filtered_df["CATEGORY"].isin(sel)]

    if "SUB_CATEGORY" in filtered_df.columns:
        with st.sidebar.expander("Filter Sub-Categories", expanded=False):
            subs = filtered_df["SUB_CATEGORY"].dropna().unique().tolist()
            sel = [s for s in subs if st.checkbox(s, True, key=f"s_{s}")]
        filtered_df = filtered_df[filtered_df["SUB_CATEGORY"].isin(sel)]

    if "Transaction Flag" in df.columns:
        with st.sidebar.expander("Transaction Status", expanded=True):
            opts = sorted(df["Transaction Flag"].dropna().astype(int).tolist())
            sel = [o for o in opts if st.checkbox(f"Status {o}", True, key=f"t_{o}")]
        filtered_df = filtered_df[filtered_df["Transaction Flag"].isin(sel)]

    if "NUM_RESPONSES" in df.columns:
        if st.sidebar.toggle("Require > 30 Responses", False):
            filtered_df = filtered_df[filtered_df["NUM_RESPONSES"] >= 30]

    return filtered_df
