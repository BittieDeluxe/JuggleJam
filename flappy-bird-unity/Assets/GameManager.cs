using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public TMP_Text scoreText;

    public static bool isPlaying = true;
    public static float BGVelocity = 0.01f;
    public static int Score = 0;

    private void Start()
    {
        // Set initial score text
        UpdateScoreText();
    }

    private void Update()
    {
        if (isPlaying)
        {
            // No longer using time-based scoring
            // Score is now incremented by PlayerController when ball is juggled
        }
    }

    // Static method to increment score for each juggle
    public static void IncrementScore()
    {
        Score++;
        // Find GameManager instance to update score text
        GameManager instance = FindObjectOfType<GameManager>();
        if (instance != null)
        {
            instance.UpdateScoreText();
        }
    }

    // Function to update the score text
    private void UpdateScoreText()
    {
        if (scoreText != null)
        {
            // Display the current score
            scoreText.text = "" + Score;
        }
        else
        {
            Debug.LogWarning("scoreText is not assigned in the GameManager script.");
        }
    }
}
