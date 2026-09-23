using AraratMorse.State;

namespace AraratMorse.Tests;

public class CopyGraderTests
{
    static string Marks(IEnumerable<(string Token, bool Matched)> graded) =>
        string.Concat(graded.Select(g => g.Matched ? '+' : '-'));

    [Fact]
    public void A_perfect_copy_matches_everything() =>
        Assert.Equal("++++", Marks(CopyGrader.GradeWords("CQ DE W1AW K", "cq de w1aw k")));

    [Fact]
    public void A_dropped_word_only_costs_that_word()
    {
        // A positional comparison would mark everything after the gap wrong.
        Assert.Equal("++-+++++", Marks(CopyGrader.GradeWords("CQ CQ CQ DE PA9GZY PA9GZY PA9GZY K", "CQ CQ DE PA9GZY PA9GZY PA9GZY K")));
    }

    [Fact]
    public void An_extra_word_costs_nothing() =>
        Assert.Equal("+++", Marks(CopyGrader.GradeWords("UR RST 599", "UR UR RST 599")));

    [Fact]
    public void Prosign_brackets_are_optional() =>
        Assert.Equal("++", Marks(CopyGrader.GradeWords("73 <SK>", "73 SK")));

    [Fact]
    public void Nothing_typed_matches_nothing() =>
        Assert.Equal("---", Marks(CopyGrader.GradeWords("TNX FER QSO", "")));

    [Fact]
    public void Callsigns_are_graded_per_character_ignoring_spaces_and_case()
    {
        var graded = CopyGrader.GradeCharacters("OH4RCI", "oh 4 r x i");
        Assert.Equal("++++-+", Marks(graded));
        Assert.Equal(["O", "H", "4", "R", "C", "I"], graded.Select(g => g.Token));
    }

    [Fact]
    public void Grading_always_returns_one_result_per_sent_token() =>
        Assert.Equal(5, CopyGrader.GradeCharacters("W1AW5", "Z").Count);
}
