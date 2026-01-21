import streamlit as st
import matplotlib.pyplot as plt
import plotly.express as px
from sklearn.linear_model import LinearRegression

CUSTOM_NAMES = {
    "VISITORS": "Visitors",
    "CALLS_7_DAYS": "Calls (7d)",
    "AVG_AHT": "Avg AHT (sec)",
    "Desktop_switch_rate": "Desktop Switch Rate",
    "VISITS": "Visits",
    "Visits_per_Visitor": "Visits per Visitor",
    "SWITCH_TO_DESKTOP": "Desktop Switches",
    "EASE_OF_USE_TOPBOX": "Ease of Use Score",
    "CEI_TOPBOX": "CEI Score",
    "Call_Rate": "Call Rate %",
}

def render_exploration_section(df):
    st.markdown("---")
    st.header("Column-wise Data Exploration")

    plot_type = st.selectbox("Select plot type", ["Bar (Top 10)", "Scatter"])
    cols = list(CUSTOM_NAMES.keys())

    if plot_type == "Bar (Top 10)":
        c = st.selectbox("Select column", cols)
        if st.button("Generate Bar Plot"):
            asc = "TOPBOX" in c
            d = df[["PAGE_GROUP", c]].dropna().sort_values(c, ascending=asc).head(10)
            fig, ax = plt.subplots()
            ax.barh(d["PAGE_GROUP"], d[c])
            ax.set_title(f"{'Bottom' if asc else 'Top'} 10 - {CUSTOM_NAMES[c]}")
            ax.invert_yaxis()
            st.pyplot(fig)

    else:
        x = st.selectbox("X-axis", cols, 0)
        y = st.selectbox("Y-axis", cols, 1)
        if st.button("Generate Scatter Plot"):
            d = df[["PAGE_GROUP", x, y]].dropna()
            model = LinearRegression().fit(d[[x]], d[[y]])
            st.info(f"Linear Correlation (R²): {model.score(d[[x]], d[[y]]):.3f}")
            fig = px.scatter(d, x=x, y=y, hover_name="PAGE_GROUP")
            st.plotly_chart(fig, use_container_width=True)
